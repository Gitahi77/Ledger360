import { apiRoute } from '@/lib/api/respond';
import { addBudget } from '@/lib/actions/budgets';
import { getBudgetsWithSpend } from '@/lib/queries/budgets';
import { AddBudgetSchema } from '@/lib/validation';

export const GET = apiRoute(
  null,
  async (req, { userId }) => {
    return getBudgetsWithSpend({ userId });
  }
);

export const POST = apiRoute(
  AddBudgetSchema,
  async (req, { body }) => {
    await addBudget(body);
    return { success: true };
  }
);
