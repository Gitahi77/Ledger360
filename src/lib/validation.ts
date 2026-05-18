// src/lib/validation.ts
// Zod schemas for all server action inputs.
// Compatible with Zod v4 (z.number() API change — use .check() for custom messages).
import { z } from 'zod';

/* ── Shared primitives ────────────────────────────────────── */
const kes = (label = 'Amount') =>
  z.number().positive(`${label} must be greater than 0`);

const optKes = (label = 'Amount') =>
  z.number().min(0, `${label} cannot be negative`);

/* ── Transactions ─────────────────────────────────────────── */
export const AddTransactionSchema = z.object({
  name:       z.string().min(1, 'Description is required').max(120, 'Description too long'),
  amount:     kes('Amount'),
  type:       z.enum(['income', 'expense']),
  categoryId: z.string().min(1, 'Category is required'),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note:       z.string().max(500, 'Note too long').optional(),
});
export type AddTransactionInput = z.infer<typeof AddTransactionSchema>;

/* ── Budgets ──────────────────────────────────────────────── */
export const AddBudgetSchema = z.object({
  name:       z.string().min(1, 'Budget name is required').max(80),
  categoryId: z.string().min(1, 'Category is required'),
  limitAmt:   kes('Spending limit'),
  period:     z.enum(['weekly', 'monthly', 'yearly']),
});
export type AddBudgetInput = z.infer<typeof AddBudgetSchema>;

/* ── Goals ────────────────────────────────────────────────── */
export const AddGoalSchema = z.object({
  name:          z.string().min(1, 'Goal name is required').max(80),
  category:      z.string().min(1),
  targetAmount:  kes('Target amount'),
  currentAmount: optKes('Current amount').optional(),
  deadline:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')).optional(),
});
export type AddGoalInput = z.infer<typeof AddGoalSchema>;

/* ── Loans ────────────────────────────────────────────────── */
export const AddLoanSchema = z.object({
  name:        z.string().min(1, 'Loan name is required').max(80),
  lender:      z.string().min(1, 'Lender is required').max(80),
  type:        z.string().min(1),
  originalAmt: kes('Original amount'),
  balance:     optKes('Current balance'),
  annualRate:  z.number().min(0).max(100),
  monthlyPmt:  kes('Monthly payment'),
  nextDue:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Next due date must be YYYY-MM-DD'),
});
export type AddLoanInput = z.infer<typeof AddLoanSchema>;

/* ── Assets ───────────────────────────────────────────────── */
export const AddAssetSchema = z.object({
  name:     z.string().min(1, 'Asset name is required').max(80),
  category: z.string().min(1),
  value:    optKes('Asset value'),
});
export type AddAssetInput = z.infer<typeof AddAssetSchema>;

/* ── Profile ──────────────────────────────────────────────── */
export const UpdateProfileSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(80),
  currency:    z.enum(['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS']),
  accountType: z.enum(['individual', 'freelancer', 'small_business']),
});
