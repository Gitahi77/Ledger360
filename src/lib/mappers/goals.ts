import type { Goal } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';

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
    targetAmountMinor: toMoneyDTO(goal.targetAmountMinor),
    deadline: toDateDTO(goal.deadline),
    userId: goal.userId,
    createdAt: toDateDTO(goal.createdAt) as string,
    currentAmountMinor: goal.currentAmountMinor !== undefined ? toMoneyDTO(goal.currentAmountMinor) : undefined,
  };
}
