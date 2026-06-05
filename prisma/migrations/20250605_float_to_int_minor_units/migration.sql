-- Safe migration from Float to Int (minor units)
-- Uses ROUND(col * 100) to preserve existing data safely.

-- Transaction
ALTER TABLE "Transaction" ALTER COLUMN "amount" TYPE INTEGER USING ROUND("amount" * 100);
ALTER TABLE "Transaction" RENAME COLUMN "amount" TO "baseAmountMinor";
ALTER TABLE "Transaction" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'KES';

-- Budget
ALTER TABLE "Budget" ALTER COLUMN "limitAmt" TYPE INTEGER USING ROUND("limitAmt" * 100);
ALTER TABLE "Budget" RENAME COLUMN "limitAmt" TO "limitAmountMinor";

-- Goal
ALTER TABLE "Goal" ALTER COLUMN "targetAmount" TYPE INTEGER USING ROUND("targetAmount" * 100);
ALTER TABLE "Goal" RENAME COLUMN "targetAmount" TO "targetAmountMinor";
ALTER TABLE "Goal" ALTER COLUMN "currentAmount" TYPE INTEGER USING ROUND("currentAmount" * 100);
ALTER TABLE "Goal" RENAME COLUMN "currentAmount" TO "currentAmountMinor";

-- Loan
ALTER TABLE "Loan" ALTER COLUMN "originalAmt" TYPE INTEGER USING ROUND("originalAmt" * 100);
ALTER TABLE "Loan" RENAME COLUMN "originalAmt" TO "originalAmountMinor";
ALTER TABLE "Loan" ALTER COLUMN "balance" TYPE INTEGER USING ROUND("balance" * 100);
ALTER TABLE "Loan" RENAME COLUMN "balance" TO "balanceMinor";
ALTER TABLE "Loan" ALTER COLUMN "monthlyPmt" TYPE INTEGER USING ROUND("monthlyPmt" * 100);
ALTER TABLE "Loan" RENAME COLUMN "monthlyPmt" TO "monthlyPaymentMinor";

-- Asset
ALTER TABLE "Asset" ALTER COLUMN "value" TYPE INTEGER USING ROUND("value" * 100);
ALTER TABLE "Asset" RENAME COLUMN "value" TO "valueMinor";
