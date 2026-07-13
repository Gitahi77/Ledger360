# WO-8: Internal Transfers & Exclusions

- `[x]` Update `prisma/schema.prisma` with `Transfer` model and relations.
- `[x]` Run `prisma migrate dev --name add_transfers`.
- `[x]` Update `src/lib/validation.ts` with `TransferSchema` (validate From/To differ, same currency).
- `[x]` Create `src/lib/actions/transfers.ts` for `createTransfer`, `deleteTransfer`, `getTransfers` with server-side validation and audit logging.
- `[x]` Update `src/lib/actions/accounts.ts` to include transfer amounts in balance computation.
- `[x]` Update `src/lib/ai.ts` system prompt to detect `transfer` transactions and exclude them from auto-import in `upload/route.ts`.
- `[x]` Update `src/app/transactions/TransactionsClient.tsx` to include `Income | Expense | Transfer` toggle.
- `[x]` Add `Transfer` form to Modal (From Account, To Account, Amount, Date, Note).
- `[x]` Interleave Transfers and Transactions chronologically in the data table.
- `[x]` Run self-audit checks.
- `[x]` Ensure Zero `any` left in `src/lib/actions`
- `[x]` Pass `npm run lint`
- `[x]` Pass `npx tsc --noEmit`
- `[x]` Pass `npm run build`
