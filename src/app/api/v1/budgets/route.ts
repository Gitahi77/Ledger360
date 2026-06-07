import { apiRoute } from '@/lib/api/respond';
import { getBudgetsWithSpend, addBudget } from '@/lib/actions/budgets';
import { AddBudgetSchema } from '@/lib/validation';

export const GET = apiRoute(
  null,
  async () => {
    return getBudgetsWithSpend();
  }
);

export const POST = apiRoute(
  AddBudgetSchema,
  async (req, { body }) => {
    await addBudget(body);
    return { success: true };
  }
);
