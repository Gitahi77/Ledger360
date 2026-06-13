-- WO-15: Save-More-Tomorrow (SavingsPlan model + Transfer.sourceTransactionId)

-- 1. Create SavingsPlan table
CREATE TABLE "SavingsPlan" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "fromAccountId"  TEXT NOT NULL,
    "toAccountId"    TEXT NOT NULL,
    "goalId"         TEXT,
    "baseRatePct"    INTEGER NOT NULL DEFAULT 10,
    "escalationPct"  INTEGER NOT NULL DEFAULT 1,
    "maxRatePct"     INTEGER NOT NULL DEFAULT 30,
    "currentRatePct" INTEGER NOT NULL DEFAULT 10,
    "nextEscalation" TIMESTAMP(3) NOT NULL,
    "active"         BOOLEAN NOT NULL DEFAULT true,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsPlan_pkey" PRIMARY KEY ("id")
);

-- 2. One plan per user (unique index)
CREATE UNIQUE INDEX "SavingsPlan_userId_key" ON "SavingsPlan"("userId");

-- 3. Foreign keys on SavingsPlan
ALTER TABLE "SavingsPlan"
    ADD CONSTRAINT "SavingsPlan_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SavingsPlan"
    ADD CONSTRAINT "SavingsPlan_fromAccountId_fkey"
    FOREIGN KEY ("fromAccountId") REFERENCES "Account"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SavingsPlan"
    ADD CONSTRAINT "SavingsPlan_toAccountId_fkey"
    FOREIGN KEY ("toAccountId") REFERENCES "Account"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SavingsPlan"
    ADD CONSTRAINT "SavingsPlan_goalId_fkey"
    FOREIGN KEY ("goalId") REFERENCES "Goal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Add sourceTransactionId to Transfer (nullable, unique for idempotency)
ALTER TABLE "Transfer" ADD COLUMN "sourceTransactionId" TEXT;
CREATE UNIQUE INDEX "Transfer_sourceTransactionId_key" ON "Transfer"("sourceTransactionId");
