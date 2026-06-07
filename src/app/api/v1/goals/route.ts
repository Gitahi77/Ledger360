import { apiRoute } from '@/lib/api/respond';
import { getGoals, addGoal } from '@/lib/actions/goals';
import { AddGoalSchema } from '@/lib/validation';

export const GET = apiRoute(
  null,
  async () => {
    return getGoals();
  }
);

export const POST = apiRoute(
  AddGoalSchema,
  async (req, { body }) => {
    await addGoal(body);
    return { success: true };
  }
);
