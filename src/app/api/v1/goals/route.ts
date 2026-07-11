import { apiRoute } from '@/lib/api/respond';
import { addGoal } from '@/lib/actions/goals';
import { getGoals } from '@/lib/queries/goals';
import { AddGoalSchema } from '@/lib/validation';

export const GET = apiRoute(
  null,
  async (req, { userId }) => {
    return getGoals({ userId });
  }
);

export const POST = apiRoute(
  AddGoalSchema,
  async (req, { body }) => {
    await addGoal(body);
    return { success: true };
  }
);
