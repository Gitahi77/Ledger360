import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RedisLockProvider } from '@/lib/jobs/LockProvider';
import { Redis } from '@upstash/redis';
import { getMetrics, setMetricsRegistry, InMemoryMetricsRegistry } from '@/lib/metrics/MetricsRegistry';

const url = process.env.UPSTASH_REDIS_REST_URL ?? "";
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

// Only test Redis logic if a real Redis instance is configured
const hasRedis = 
  url.length > 0 && 
  token.length > 0 &&
  !url.includes("dummy");

describe.runIf(hasRedis)('RedisLockProvider Integration', () => {
  let provider: RedisLockProvider;
  let redis: Redis;

  beforeEach(() => {
    setMetricsRegistry(new InMemoryMetricsRegistry());
    redis = Redis.fromEnv();
    provider = new RedisLockProvider(redis);
  });

  afterEach(async () => {
    if (!hasRedis) return;
    
    // Cleanup keys
    await redis.del('integration:lock1');
    await redis.del('integration:lock2');
  });

  it('SET NX PX semantics: allows single acquirer', async () => {
    const r1 = await provider.acquire('integration:lock1', 'token-a', 5000);
    expect(r1).toBe(true);

    const r2 = await provider.acquire('integration:lock1', 'token-b', 5000);
    expect(r2).toBe(false); // Held by token-a
  });

  it('Lua release script: allows correct owner to release', async () => {
    await provider.acquire('integration:lock1', 'owner-token', 5000);

    // Wrong owner fails to release (simulate by checking it is still held)
    await provider.release('integration:lock1', 'thief-token');
    expect(await provider.acquire('integration:lock1', 'new-token', 5000)).toBe(false);

    // Correct owner releases
    await provider.release('integration:lock1', 'owner-token');
    expect(await provider.acquire('integration:lock1', 'new-token', 5000)).toBe(true);
  });

  it('Lock expiry: allows new acquirer after TTL', async () => {
    // Acquire with short 200ms TTL
    await provider.acquire('integration:lock2', 'token-c', 200);

    // Immediate acquire fails
    expect(await provider.acquire('integration:lock2', 'token-d', 5000)).toBe(false);

    // Wait for TTL expiration
    await new Promise(r => setTimeout(r, 300));

    // Can now acquire
    expect(await provider.acquire('integration:lock2', 'token-d', 5000)).toBe(true);
  });

  it('Records Redis telemetry correctly', async () => {
    await provider.acquire('integration:lock1', 'token-x', 5000);
    await provider.acquire('integration:lock1', 'token-y', 5000); // Fails
    await provider.release('integration:lock1', 'token-x');

    const summaries = getMetrics().getAllSummaries();
    
    // 2 acquires attempted
    expect(summaries.financial.ledger_lock_acquire_total).toBe(2);
    // 1 failure
    expect(summaries.financial.ledger_lock_acquire_failed_total).toBe(1);
    // 1 successful release
    expect(summaries.financial.ledger_lock_release_total).toBe(1);
    // At least 2 wait times recorded
    expect(summaries.financial.ledger_lock_wait_ms).toBeDefined();
  });
});
