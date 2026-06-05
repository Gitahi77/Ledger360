/*
  Warnings:

  - You are about to drop the column `currentAmountMinor` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `daysOverdue` on the `Loan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "currentAmountMinor";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "daysOverdue";

-- AlterTable
ALTER TABLE "Transfer" ALTER COLUMN "toAccountId" DROP NOT NULL;
