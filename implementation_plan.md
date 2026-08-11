# WO-8: Internal Transfers & Exclusions

Implement internal transfers between user accounts without distorting income/expense analytics, and adjust the Smart Upload AI to correctly flag transfer rows without auto-creating them.

## User Decisions & Corrections (Approved)

- **UI Design**: Use a segmented toggle inside the existing transaction modal (`Income` / `Expense` / `Transfer`). In Transfer mode, hide Category and show `From Account` -> `To Account`. Validate that From and To are different accounts and both belong to the user, with matching currencies.
- **Smart Upload AI**: The AI must detect and tag likely transfers/savings with `suggestedType: 'transfer'`. Exclude these from auto-imported income/expense transactions and return them separately. No auto-creation of Transfer records (deferred to WO-11).
- **Schema & Migration**: Create the full `Transfer` model via `prisma migrate dev --name add_transfers`. Do NOT use `prisma db push`. 
- **Balances**: Balances remain computed on-the-fly via `getAccountBalances`. No running balances will be stored.

## Proposed Changes

### 1. Database Schema (`prisma/schema.prisma`)

#### [MODIFY] [schema.prisma](file:///C:/Users/GITAHI/.gemini/antigravity/scratch/ledger360/prisma/schema.prisma)
Add the `Transfer` model precisely as defined in Part 9 of the Definitive Spec:
```prisma
model Transfer {
  id              String   @id @default(cuid())
  userId          String
  fromAccountId   String
  toAccountId     String
  amountMinor     Int
  currency        String
  baseAmountMinor Int
  fxRate          Decimal  @db.Decimal(10, 6)
  date            DateTime
  note            String?
  source          String   @default("MANUAL") // MANUAL, IMPORT, SYSTEM
  goalId          String?
  loanId          String?
  createdAt       DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  fromAccount Account  @relation("TransferFrom", fields: [fromAccountId], references: [id], onDelete: Restrict)
  toAccount   Account  @relation("TransferTo", fields: [toAccountId], references: [id], onDelete: Restrict)
  goal        Goal?    @relation(fields: [goalId], references: [id], onDelete: SetNull)
  loan        Loan?    @relation(fields: [loanId], references: [id], onDelete: SetNull)

  @@index([userId, date])
  @@index([fromAccountId])
  @@index([toAccountId])
}
```
*Note: Also add `transfersFrom Transfer[] @relation("TransferFrom")` and `transfersTo Transfer[] @relation("TransferTo")` to the `Account` model, and `transfers Transfer[]` to the `User`, `Goal`, and `Loan` models.*

### 2. Validation & Actions

#### [MODIFY] [validation.ts](file:///C:/Users/GITAHI/.gemini/antigravity/scratch/ledger360/src/lib/validation.ts)
- Add `TransferSchema` (date, fromAccountId, toAccountId, amount, currency, note). Validate `fromAccountId !== toAccountId`.

#### [NEW] [actions/transfers.ts](file:///C:/Users/GITAHI/.gemini/antigravity/scratch/ledger360/src/lib/actions/transfers.ts)
- `createTransfer(data)`: Scopes to user, handles `toMinor`, sets `baseAmountMinor = amountMinor`, `fxRate = 1`, creates `Transfer`, logs audit.
- `deleteTransfer(id)`: Atomic delete `deleteMany({ id, userId })`, logs audit.
- `getTransfers()`: Fetches transfers scoped to `userId`, sorted by date desc.

#### [MODIFY] [actions/accounts.ts](file:///C:/Users/GITAHI/.gemini/antigravity/scratch/ledger360/src/lib/actions/accounts.ts)
- Update `getAccountBalances()` to compute net transfer balance: subtract `amountMinor` for `fromAccountId` matches, add `amountMinor` for `toAccountId` matches.

### 3. Smart Upload Integration

#### [MODIFY] [ai.ts](file:///C:/Users/GITAHI/.gemini/antigravity/scratch/ledger360/src/lib/ai.ts) / `api/upload/route.ts`
- Adjust the LLM system prompt to categorize matching criteria as `type: 'transfer'` (or `suggestedType`).
- Filter out rows tagged as `transfer` from being inserted into the `Transaction` table.
- Return the separated list of `detectedTransfers` in the API response.

### 4. UI Components

#### [MODIFY] [TransactionsClient.tsx](file:///C:/Users/GITAHI/.gemini/antigravity/scratch/ledger360/src/app/transactions/TransactionsClient.tsx)
- Add segmented toggle: `[Income] [Expense] [Transfer]`.
- Implement `Transfer` form view in the modal.
- Call `createTransfer` Server Action instead of `createTransaction` when in transfer mode.
- Update table view to display transfers inline with transactions, or on a separate tab (will merge them via a union or display them cleanly with special transfer icons). *Wait: merging them in the main table is best for a chronological ledger, we will fetch both and interleave them by date.*

## Verification Plan

### Automated Checks
- `tsc --noEmit`
- `npm run build`
- `npm test`

# Phase 6: Accounts Domain

**Sequence:**
1. **Phase 6A:** Accounts Product Brief & UX Review
2. **Phase 6B:** Accounts DTO / Data Contract
3. **Phase 6C:** Visual Blueprint & Interaction Contract
4. **Phase 6D:** Implementation**Status:** ✅ Passed

### Phase 6E: Passed
- ✅ Comprehensive audit against Phase 6A-6C contracts complete.
- ✅ Remediated identified contract violations (Data Freshness, UI defects).

### Phase 6F: In Progress
- Confirm `git diff` contains only intended Phase 6 Accounts changes.
- Final validation: `tsc`, `lint`, `build`.
- Commit, Push, and Verify CI/CD pipeline.

*We are currently at Phase 6D (Implementation).*

### Logic Checks
- Transfer from Account A to Account B reduces A's computed balance and increases B's computed balance.
- Transfers do NOT show up in Income/Expense analytics (since they are in the `Transfer` table, not `Transaction` table).
- AI upload of internal savings correctly tags as transfer and omits from `Transaction` table.
