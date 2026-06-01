// src/lib/rateLimit.ts
// In-process rate limiter — works for single-server deployments and Vercel
// (each Vercel cold-start gets its own instance; for distributed limiting add Upstash Redis).
//
// Usage:
//   const limiter = new RateLimiter({ windowMs: 60_000, max: 5 });
//   const { ok, retryAfter } = limiter.check(key);
//   if (!ok) return 429;

interface Entry { count: number; reset: number; }

export class RateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly store = new Map<string, Entry>();

  constructor({ windowMs, max }: { windowMs: number; max: number }) {
    this.windowMs = windowMs;
    this.max = max;
  }

  check(key: string): { ok: boolean; retryAfter: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.reset) {
      // New window
      this.store.set(key, { count: 1, reset: now + this.windowMs });
      // Opportunistic cleanup: remove ~10% of expired keys to prevent memory leak
      if (Math.random() < 0.1) this.#cleanup(now);
      return { ok: true, retryAfter: 0 };
    }

    if (entry.count >= this.max) {
      return { ok: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
    }

    entry.count++;
    return { ok: true, retryAfter: 0 };
  }

  #cleanup(now: number) {
    for (const [k, v] of this.store) {
      if (now > v.reset) this.store.delete(k);
    }
  }
}

// ── Shared singleton limiters ────────────────────────────────
// These are module-level singletons, shared across requests in the same process.

/** Login: max 10 attempts per IP per 15 minutes */
export const loginLimiter = new RateLimiter({ windowMs: 15 * 60_000, max: 10 });

/** Signup: max 5 new accounts per IP per hour */
export const signupLimiter = new RateLimiter({ windowMs: 60 * 60_000, max: 5 });

/** Upload: max 20 uploads per user per hour */
export const uploadLimiter = new RateLimiter({ windowMs: 60 * 60_000, max: 20 });
