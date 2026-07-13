// src/lib/validation.ts
// Zod schemas for all server action inputs.
// Compatible with Zod v4 (z.number() API change — use .check() for custom messages).
import { z } from 'zod';

/* -- Shared primitives -------------------------------------- */
const kes = (label = 'Amount') =>
  z.number().positive(`${label} must be greater than 0`);

const optKes = (label = 'Amount') =>
  z.number().min(0, `${label} cannot be negative`);

/* -- Transactions ------------------------------------------- */
export const AddTransactionSchema = z.object({
  name:       z.string().min(1, 'Description is required').max(120, 'Description too long'),
  baseAmountMinor:     kes('Amount'),
  type:       z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Category is required'),
  accountId:  z.string().optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note:       z.string().max(500, 'Note too long').optional(),
});
export type AddTransactionInput = z.infer<typeof AddTransactionSchema>;

/* -- Transfers ---------------------------------------------- */
export const AddTransferSchema = z.object({
  fromAccountId: z.string().min(1, 'From account is required'),
  toAccountId:   z.string().optional().nullable(),
  amountMinor:   kes('Amount'),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note:          z.string().max(500, 'Note too long').optional(),
  goalId:        z.string().optional().nullable(),
  loanId:        z.string().optional().nullable(),
  interestMinor: z.number().min(0, 'Interest cannot be negative').optional(),
  idempotencyKey: z.string().optional(),
}).refine(data => {
  if (data.toAccountId && data.fromAccountId === data.toAccountId) return false;
  return true;
}, {
  message: "From and To accounts must be different",
  path: ["toAccountId"],
}).refine(data => {
  if (data.loanId) return !data.toAccountId;
  return !!data.toAccountId;
}, {
  message: "Loan repayments cannot have a destination account; other transfers require one",
  path: ["toAccountId"],
});
export type AddTransferInput = z.infer<typeof AddTransferSchema>;

export const EditTransferSchema = z.object({
  fromAccountId: z.string().min(1, 'From account is required'),
  toAccountId:   z.string().optional().nullable(),
  amountMinor:   kes('Amount'),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note:          z.string().max(500, 'Note too long').optional(),
  goalId:        z.string().optional().nullable(),
  loanId:        z.string().optional().nullable(),
  interestMinor: z.number().min(0, 'Interest cannot be negative').optional(),
}).partial();
export type EditTransferInput = z.infer<typeof EditTransferSchema>;

/* -- Budgets ------------------------------------------------ */
export const AddBudgetSchema = z.object({
  name:       z.string().min(1, 'Budget name is required').max(80),
  categoryId: z.string().min(1, 'Category is required'),
  limitAmountMinor:   kes('Spending limit'),
  period:     z.enum(['weekly', 'monthly', 'yearly']),
  rollover:   z.boolean().optional().default(false),
});
export type AddBudgetInput = z.infer<typeof AddBudgetSchema>;

/* -- Goals -------------------------------------------------- */
export const AddGoalSchema = z.object({
  name:          z.string().min(1, 'Goal name is required').max(80),
  category:      z.string().min(1),
  targetAmountMinor:  kes('Target amount'),
  deadline:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).optional(),
});
export type AddGoalInput = z.infer<typeof AddGoalSchema>;

/* -- Loans -------------------------------------------------- */
export const AddLoanSchema = z.object({
  name:        z.string().min(1, 'Loan name is required').max(80),
  lender:      z.string().min(1, 'Lender is required').max(80),
  type:        z.string().min(1),
  originalAmountMinor: kes('Original amount'),
  balanceMinor:     optKes('Current balance'),
  annualRate:  z.number().min(0).max(100),
  amortization: z.enum(['REDUCING_BALANCE', 'FLAT_RATE']),
  monthlyPaymentMinor:  kes('Monthly payment'),
  nextDue:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next due date must be YYYY-MM-DD'),
  disbursementType: z.enum(['existing_debt', 'received_funds']).optional(),
  disbursementAccountId: z.string().optional(),
});
export type AddLoanInput = z.infer<typeof AddLoanSchema>;

/* -- Assets ------------------------------------------------- */
export const AddAssetSchema = z.object({
  name:     z.string().min(1, 'Asset name is required').max(80),
  category: z.enum(['Property', 'Investment', 'Vehicle', 'Other']),
  valueMinor:    optKes('Asset value'),
  symbol:   z.string().optional(),
});
export type AddAssetInput = z.infer<typeof AddAssetSchema>;

/* -- Profile ------------------------------------------------ */
export const UpdateProfileSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(80),
  currency:    z.enum(['KES']),
  accountType: z.enum(['individual', 'freelancer', 'small_business']),
});

/* -- Savings Plan (WO-15) ----------------------------------- */
export const UpsertSavingsPlanSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId:   z.string().min(1, 'Destination account is required'),
  goalId:        z.string().optional().nullable(),
  baseRatePct:   z.number().int().min(1).max(80),
  escalationPct: z.number().int().min(0).max(20),
  maxRatePct:    z.number().int().min(1).max(80),
  active:        z.boolean(),
}).refine(data => data.maxRatePct >= data.baseRatePct, {
  message: 'Max rate must be ≥ base rate',
  path: ['maxRatePct'],
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: 'Source and destination must be different accounts',
  path: ['toAccountId'],
});
export type UpsertSavingsPlanInput = z.infer<typeof UpsertSavingsPlanSchema>;
