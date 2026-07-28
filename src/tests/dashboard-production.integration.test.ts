import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';
import { buildFinancialSnapshot } from '../lib/domain/snapshot';
import { buildDashboardPresentation } from '../app/(dashboard)/presentation';

describe('Phase 9B.4 Production Smoke Test', () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `smoke-test-${randomUUID()}@example.com`,
        name: 'Smoke Tester',
        currency: 'KES',
      }
    });
    testUserId = user.id;

    // Create an account and transaction so snapshot isn't entirely empty
    await prisma.account.create({
      data: {
        userId: testUserId,
        name: 'Smoke Checking',
        type: 'CHECKING',
        currency: 'KES',
        allowNegativeBalance: false,
        openingMinor: 10000_00n,
        balanceMinor: 10000_00n
      }
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('Dashboard production pipeline: builds snapshot and presentation without errors', async () => {
    // 1. Authenticated User (mocked by DB row)
    
    // 2. FinancialSnapshot builds
    const snapshot = await buildFinancialSnapshot(testUserId);
    expect(snapshot.metadata.userId).toBe(testUserId);
    expect(snapshot.metadata.version).toBe(1);
    
    // 3. Presentation builds
    const presentation = buildDashboardPresentation(snapshot);
    expect(presentation).toBeDefined();

    // 4. Verify Hero metric calculation (Safe to Spend should be KES 10,000)
    expect(presentation.hero.metric.label).toBe('Safe to Spend');
    expect(presentation.hero.metric.value.replace(/\u00A0/g, ' ')).toBe('KES 10,000');
  });
});
