import { prisma } from '../lib/prisma';
import { BalanceService } from '../lib/domain/services/BalanceService';

async function runParityCheck() {
  console.log('Starting Financial Correctness Verification (Parity Check)...');
  
  // Get all users
  const users = await prisma.user.findMany({ select: { id: true } });
  
  let totalAccounts = 0;
  let matches = 0;
  let mismatches = 0;

  for (const user of users) {
    const enrichedAccounts = await BalanceService.getEnrichedAccounts(user.id);
    
    for (const enriched of enrichedAccounts) {
      totalAccounts++;
      const single = await BalanceService.getSingleAccountBalance(user.id, enriched.id);
      
      if (!single) {
        console.error(`❌ Mismatch for account ${enriched.id}: getSingleAccountBalance returned null`);
        mismatches++;
        continue;
      }
      
      const enrichedBalance = enriched.balanceMinor;
      const singleBalance = single.balanceMinor;
      
      if (enrichedBalance === singleBalance) {
        matches++;
      } else {
        console.error(`❌ Mismatch for account ${enriched.id}:`);
        console.error(`   Enriched: ${enrichedBalance}`);
        console.error(`   Single:   ${singleBalance}`);
        mismatches++;
      }
    }
  }

  console.log(`\nVerification Complete.`);
  console.log(`Total Accounts Checked: ${totalAccounts}`);
  console.log(`✅ Matches: ${matches}`);
  console.log(`❌ Mismatches: ${mismatches}`);

  if (mismatches > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runParityCheck().catch(console.error);
