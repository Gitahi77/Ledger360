import type { Goal } from '@prisma/client';
import { serializeMoney, serializeDate } from './core';

export type GoalDTO = {
  id: string;
  name: string;
  category: string;
  targetAmountMinor: number;
  deadline: string | null;
  userId: string;
  createdAt: string;
  currentAmountMinor?: number; // Added during hydration
};

export function mapGoalToDTO(
  goal: Goal & { currentAmountMinor?: bigint | number }
): GoalDTO {
  return {
    id: goal.id,
    name: goal.name,
    category: goal.category,
    targetAmountMinor: serializeMoney(goal.targetAmountMinor),
    deadline: serializeDate(goal.deadline),
    userId: goal.userId,
    createdAt: serializeDate(goal.createdAt) as string,
    currentAmountMinor: goal.currentAmountMinor !== undefined ? serializeMoney(goal.currentAmountMinor) : undefined,
  };
}
