import { recalculateBalances } from './reconciliation';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Starting balance backfill...');
  
  const startTime = Date.now();

  const totalProcessed = await recalculateBalances((processed, total) => {
    console.log(`[Backfill Progress] Processed ${processed} of ${total} accounts.`);
  });

  const durationStr = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Backfill complete. Recomputed balances for ${totalProcessed} accounts in ${durationStr}s.`);
}

main()
  .catch(e => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
