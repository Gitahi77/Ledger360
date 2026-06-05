-- 1. Rename the old NextAuth Account table to OAuthAccount
ALTER TABLE "Account" RENAME TO "OAuthAccount";

-- Rename the primary key constraint if it exists (Prisma defaults)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Account_pkey') THEN
    ALTER TABLE "OAuthAccount" RENAME CONSTRAINT "Account_pkey" TO "OAuthAccount_pkey";
  END IF;
END $$;

-- Rename the unique index on provider/providerAccountId
ALTER INDEX IF EXISTS "Account_provider_providerAccountId_key" RENAME TO "OAuthAccount_provider_providerAccountId_key";

-- Rename the foreign key constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Account_userId_fkey') THEN
    ALTER TABLE "OAuthAccount" RENAME CONSTRAINT "Account_userId_fkey" TO "OAuthAccount_userId_fkey";
  END IF;
END $$;

-- 2. Create the NEW financial Account table
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "openingMinor" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Account_userId_idx" ON "Account"("userId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Backfill default Accounts for any existing users
-- Use gen_random_uuid() as a stand-in for CUID, Prisma is perfectly fine with UUIDs as string IDs.
INSERT INTO "Account" ("id", "userId", "name", "type", "currency", "openingMinor", "archived", "createdAt")
SELECT 
    gen_random_uuid()::text,
    "id", 
    'M-Pesa', 
    'mobile', 
    'KES', 
    0, 
    false, 
    NOW()
FROM "User"
WHERE NOT EXISTS (SELECT 1 FROM "Account" WHERE "Account"."userId" = "User"."id");

-- 4. Add the accountId column to Transaction, nullable initially to allow backfill
ALTER TABLE "Transaction" ADD COLUMN "accountId" TEXT;

-- 5. Backfill Transaction.accountId using the default account for the user
UPDATE "Transaction"
SET "accountId" = (
    SELECT "id" FROM "Account" 
    WHERE "Account"."userId" = "Transaction"."userId" 
    ORDER BY "createdAt" ASC
    LIMIT 1
)
WHERE "accountId" IS NULL;

-- 6. Enforce accountId is NOT NULL (now that existing rows are backfilled)
-- First, if there are any orphaned transactions (user has no account?), which shouldn't happen due to step 3, but just in case:
DELETE FROM "Transaction" WHERE "accountId" IS NULL;

ALTER TABLE "Transaction" ALTER COLUMN "accountId" SET NOT NULL;

-- 7. Add the foreign key constraint for Transaction -> Account
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
