import { prisma } from '../lib/prisma';
import assert from 'assert';

const TEST_USER_ID = 'concurrency-user-1';
const TEST_ACCOUNT_ID = 'concurrency-account-1';
const TEST_CATEGORY_ID = 'concurrency-category-1';
const BASE_URL = 'http://localhost:3000/api/v1';

const headers = {
  'Content-Type': 'application/json',
  'x-benchmark-user-id': TEST_USER_ID
};

async function setup() {
  console.log('Setting up test data...');
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: { id: TEST_USER_ID, name: 'Concurrency User', email: 'concurrency@test.com', currency: 'KES', accountType: 'individual' }
  });
  
  await prisma.category.upsert({
    where: { name_userId: { name: 'Concurrency Category', userId: TEST_USER_ID } },
    update: {},
    create: { id: TEST_CATEGORY_ID, name: 'Concurrency Category', userId: TEST_USER_ID, type: 'expense' }
  });

  // Reset account balance and wipe transactions
  await prisma.transaction.deleteMany({ where: { accountId: TEST_ACCOUNT_ID } });
  
  await prisma.account.upsert({
    where: { id: TEST_ACCOUNT_ID },
    update: { balanceMinor: 0n },
    create: { id: TEST_ACCOUNT_ID, userId: TEST_USER_ID, name: 'Concurrency Account', type: 'CHECKING', currency: 'KES', balanceMinor: 0n, allowNegativeBalance: true }
  });
  
  // Disconnect so we don't hold the connection pool while Next.js handles 100 requests
  await prisma.$disconnect();
}

async function verifyBalance(expected: bigint, scenario: string) {
  const acc = await prisma.account.findUnique({ where: { id: TEST_ACCOUNT_ID } });
  assert(acc, 'Account not found');
  
  const txs = await prisma.transaction.aggregate({
    where: { accountId: TEST_ACCOUNT_ID },
    _sum: { baseAmountMinor: true }
  });
  const sumTx = txs._sum.baseAmountMinor || 0n;
  
  console.log(`[${scenario}] Expected: ${expected}, Actual: ${acc.balanceMinor}, SumTx: ${sumTx}`);
  assert(acc.balanceMinor === expected, `Balance mismatch! Expected ${expected}, got ${acc.balanceMinor}`);
  assert(acc.balanceMinor === sumTx, `Drift detected! Balance ${acc.balanceMinor} != SumTx ${sumTx}`);
  
  await prisma.$disconnect();
}

async function testConcurrentDeposits() {
  console.log('\n--- Running 100 concurrent deposits ---');
  await setup();
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: TEST_USER_ID,
        accountId: TEST_ACCOUNT_ID,
        categoryId: TEST_CATEGORY_ID,
        type: 'income',
        baseAmountMinor: 10,
        date: new Date().toISOString().split('T')[0],
        name: `Deposit ${i}`
      })
    }).then(async res => {
      const data = await res.json();
      if (!res.ok || data.error) console.error(`Deposit ${i} failed:`, data.error);
      return data;
    }));
  }
  await Promise.all(promises);
  await verifyBalance(1000n, 'Deposits');
}

async function testConcurrentWithdrawals() {
  console.log('\n--- Running 100 concurrent withdrawals ---');
  await setup();
  // Start with 1000 balance
  await prisma.account.update({ where: { id: TEST_ACCOUNT_ID }, data: { balanceMinor: 1000n } });
  
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userId: TEST_USER_ID,
        accountId: TEST_ACCOUNT_ID,
        categoryId: TEST_CATEGORY_ID,
        type: 'expense',
        baseAmountMinor: 10, // Stored as -10 in DB for expense
        date: new Date().toISOString().split('T')[0],
        name: `Withdrawal ${i}`
      })
    }).then(res => res.json()));
  }
  await Promise.all(promises);
  await verifyBalance(0n, 'Withdrawals');
}

async function main() {
  try {
    await testConcurrentDeposits();
    await testConcurrentWithdrawals();
    console.log('\n✅ All tested scenarios passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
