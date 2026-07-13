import { prisma } from '../src/lib/prisma';
import { BalanceService } from '../src/lib/domain/services/BalanceService';
import fs from 'fs';
import path from 'path';

async function capturePostRefactor() {
  const users = await prisma.user.findMany();
  const baseline: Record<string, any> = {};

  for (const user of users) {
    const accounts = await BalanceService.getEnrichedAccounts(user.id);
    
    // Also capture transaction count and sum of baseAmountMinor as a raw integrity check
    const rawTxAggr = await prisma.transaction.aggregate({
      where: { userId: user.id },
      _sum: { baseAmountMinor: true },
      _count: { _all: true }
    });

    const rawTransferAggr = await prisma.transfer.aggregate({
      where: { userId: user.id },
      _sum: { baseAmountMinor: true },
      _count: { _all: true }
    });

    baseline[user.id] = {
      accounts,
      rawTxAggr: {
        sum: rawTxAggr._sum.baseAmountMinor?.toString() || '0',
        count: rawTxAggr._count._all
      },
      rawTransferAggr: {
        sum: rawTransferAggr._sum.baseAmountMinor?.toString() || '0',
        count: rawTransferAggr._count._all
      }
    };
  }

  const outPath = path.join(process.cwd(), 'scratch', 'post-refactor.json');
  fs.writeFileSync(outPath, JSON.stringify(baseline, null, 2));
  console.log('Post-refactor captured to:', outPath);
}

capturePostRefactor()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
