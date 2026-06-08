-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "rollover" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "expectedMonthlyIncomeMinor" INTEGER;
