-- Add CHECK constraint to Account: if allowNegativeBalance is false, balanceMinor must be >= 0
ALTER TABLE "Account" 
ADD CONSTRAINT "account_balance_non_negative_check" 
CHECK ("allowNegativeBalance" = true OR "balanceMinor" >= 0);

-- Add CHECK constraint to Budget: limitAmountMinor must be > 0
ALTER TABLE "Budget" 
ADD CONSTRAINT "budget_limit_positive_check" 
CHECK ("limitAmountMinor" > 0);

-- Add CHECK constraint to Goal: targetAmountMinor must be > 0
ALTER TABLE "Goal" 
ADD CONSTRAINT "goal_target_positive_check" 
CHECK ("targetAmountMinor" > 0);

-- Add CHECK constraint to Loan: original amount and payment must be positive
ALTER TABLE "Loan" 
ADD CONSTRAINT "loan_amounts_positive_check" 
CHECK ("originalAmountMinor" >= 0 AND "balanceMinor" >= 0 AND "monthlyPaymentMinor" >= 0);

-- Add CHECK constraint to Transaction: baseAmountMinor cannot be zero
ALTER TABLE "Transaction"
ADD CONSTRAINT "transaction_amount_nonzero_check"
CHECK ("baseAmountMinor" != 0);

-- Add CHECK constraint to Transfer: baseAmountMinor cannot be zero
ALTER TABLE "Transfer"
ADD CONSTRAINT "transfer_amount_nonzero_check"
CHECK ("baseAmountMinor" != 0 AND "amountMinor" != 0);
