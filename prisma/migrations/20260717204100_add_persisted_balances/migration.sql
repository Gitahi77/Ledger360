-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "balanceMinor" BIGINT NOT NULL DEFAULT 0;
ALTER TABLE "Account" ADD COLUMN     "allowNegativeBalance" BOOLEAN NOT NULL DEFAULT false;

-- AddCheckConstraint
ALTER TABLE "Account" ADD CONSTRAINT "account_balance_check" CHECK ("balanceMinor" >= 0 OR "allowNegativeBalance" = true);
