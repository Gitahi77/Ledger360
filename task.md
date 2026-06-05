# WO-8: Internal Transfers & Exclusions

- `[ ]` Update `prisma/schema.prisma` with `Transfer` model and relations.
- `[ ]` Run `prisma migrate dev --name add_transfers`.
- `[ ]` Update `src/lib/validation.ts` with `TransferSchema` (validate From/To differ, same currency).
- `[ ]` Create `src/lib/actions/transfers.ts` for `createTransfer`, `deleteTransfer`, `getTransfers` with server-side validation and audit logging.
- `[ ]` Update `src/lib/actions/accounts.ts` to include transfer amounts in balance computation.
- `[ ]` Update `src/lib/ai.ts` system prompt to detect `transfer` transactions and exclude them from auto-import in `upload/route.ts`.
- `[ ]` Update `src/app/transactions/TransactionsClient.tsx` to include `Income | Expense | Transfer` toggle.
- `[ ]` Add `Transfer` form to Modal (From Account, To Account, Amount, Date, Note).
- `[ ]` Interleave Transfers and Transactions chronologically in the data table.
- `[ ]` Run self-audit checks.
