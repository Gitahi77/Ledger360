const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get a user with many transactions (if possible)
  const user = await prisma.user.findFirst({
    include: { _count: { select: { transactions: true } } },
    orderBy: { transactions: { _count: 'desc' } }
  });

  if (!user) {
    console.log("No users found");
    return;
  }

  console.log(`Using user ${user.id} with ${user._count.transactions} transactions.`);

  console.log("\n--- EXPLAIN ANALYZE for Transaction.groupBy ---");
  const explainTx = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT "accountId", SUM("baseAmountMinor") as "sum"
    FROM "Transaction"
    WHERE "userId" = $1 AND "isVoided" = false
    GROUP BY "accountId"
  `, user.id);
  console.log(explainTx.map(row => row['QUERY PLAN']).join('\n'));

  console.log("\n--- EXPLAIN ANALYZE for Transfer.groupBy (From) ---");
  const explainTransferFrom = await prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT "fromAccountId" as "accountId", SUM("baseAmountMinor") as "sum"
    FROM "Transfer"
    WHERE "userId" = $1 AND "status" = 'COMPLETED' AND "isVoided" = false
    GROUP BY "fromAccountId"
  `, user.id);
  console.log(explainTransferFrom.map(row => row['QUERY PLAN']).join('\n'));
}

main().catch(console.error).finally(() => prisma.$disconnect());
