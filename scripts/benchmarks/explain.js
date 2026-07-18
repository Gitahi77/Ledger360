"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../../src/lib/prisma");
async function main() {
    const user = await prisma_1.prisma.user.findFirst({
        include: { _count: { select: { transactions: true } } },
        orderBy: { transactions: { _count: 'desc' } }
    });
    if (!user) {
        console.log("No users found");
        return;
    }
    console.log(`Using user ${user.id} with ${user._count.transactions} transactions.`);
    console.log("\n--- EXPLAIN ANALYZE for Transaction.groupBy (Income) ---");
    const explainTxIncome = await prisma_1.prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT "accountId", SUM("baseAmountMinor") as "sum"
    FROM "Transaction"
    WHERE "userId" = $1
      AND NOT ("name" ILIKE '%VOIDED%' OR "name" ILIKE '%pending%')
      AND "type" = 'income'
    GROUP BY "accountId"
  `, user.id);
    console.log(explainTxIncome.map((row) => row['QUERY PLAN']).join('\n'));
    console.log("\n--- EXPLAIN ANALYZE for Transfer.groupBy (From) ---");
    const explainTransferFrom = await prisma_1.prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT "fromAccountId", SUM("amountMinor") as "sum"
    FROM "Transfer"
    WHERE "userId" = $1
    GROUP BY "fromAccountId"
  `, user.id);
    console.log(explainTransferFrom.map((row) => row['QUERY PLAN']).join('\n'));
    console.log("\n--- EXPLAIN ANALYZE for Transfer.groupBy (To) ---");
    const explainTransferTo = await prisma_1.prisma.$queryRawUnsafe(`
    EXPLAIN (ANALYZE, BUFFERS)
    SELECT "toAccountId", SUM("baseAmountMinor") as "sum"
    FROM "Transfer"
    WHERE "userId" = $1
    GROUP BY "toAccountId"
  `, user.id);
    console.log(explainTransferTo.map((row) => row['QUERY PLAN']).join('\n'));
}
main().catch(console.error).finally(() => prisma_1.prisma.$disconnect());
