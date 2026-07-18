-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "balanceMinor" BIGINT NOT NULL DEFAULT 0;

-- AddCheckConstraint
ALTER TABLE "Account" ADD CONSTRAINT "account_balance_check" CHECK ("balanceMinor" >= 0 OR "allowNegativeBalance" = true);
