-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'MPESA', 'AIRTEL_MONEY', 'CREDIT_CARD', 'SACCO_DEPOSIT', 'SACCO_LOAN', 'CHAMA', 'MORTGAGE', 'AUTO_LOAN', 'BROKERAGE', 'CRYPTO');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "type" TYPE "AccountType" USING (UPPER("type"))::"AccountType",
ALTER COLUMN "type" SET DEFAULT 'CHECKING',
ALTER COLUMN "openingMinor" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "symbol" TEXT,
ALTER COLUMN "valueMinor" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "entityId" TEXT,
ALTER COLUMN "metadata" TYPE JSONB USING "metadata"::jsonb;

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "limitAmountMinor" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Goal" ALTER COLUMN "targetAmountMinor" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "amortization" TEXT NOT NULL DEFAULT 'REDUCING_BALANCE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "originalAmountMinor" SET DATA TYPE BIGINT,
ALTER COLUMN "balanceMinor" SET DATA TYPE BIGINT,
ALTER COLUMN "monthlyPaymentMinor" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "baseAmountMinor" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "idempotencyKey" TEXT,
ALTER COLUMN "fromAccountId" DROP NOT NULL,
ALTER COLUMN "amountMinor" SET DATA TYPE BIGINT,
ALTER COLUMN "baseAmountMinor" SET DATA TYPE BIGINT,
ALTER COLUMN "interestMinor" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "serializedResponse" JSONB,
    "resourceId" TEXT,
    "processingStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("idempotencyKey")
);

-- CreateTable
CREATE TABLE "ChamaDetails" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "monthlyContrib" BIGINT NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "yourPayoutPosition" INTEGER NOT NULL,
    "cycleStartDate" TIMESTAMP(3) NOT NULL,
    "meetingDay" INTEGER NOT NULL,

    CONSTRAINT "ChamaDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChamaDetails_accountId_key" ON "ChamaDetails"("accountId");

-- CreateIndex
CREATE INDEX "AuditLog_resource_entityId_idx" ON "AuditLog"("resource", "entityId");

-- CreateIndex
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Transaction_accountId_idx" ON "Transaction"("accountId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_accountId_idx" ON "Transaction"("userId", "type", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_idempotencyKey_key" ON "Transfer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Transfer_goalId_idx" ON "Transfer"("goalId");

-- CreateIndex
CREATE INDEX "Transfer_loanId_idx" ON "Transfer"("loanId");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_sourceTransactionId_fkey" FOREIGN KEY ("sourceTransactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChamaDetails" ADD CONSTRAINT "ChamaDetails_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

