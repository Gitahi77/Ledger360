import type { Goal } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';
import type { MoneyDTO } from '../types/domain';

export type GoalDTO = {
  id: string;
  name: string;
  category: string;
  targetMoney: MoneyDTO;
  deadline: string | null;
  userId: string;
  createdAt: string;
  currentMoney?: MoneyDTO; // Added during hydration
};

export function mapGoalToDTO(
  goal: Goal & { currentAmountMinor?: bigint | number },
  baseCurrency: string = 'KES'
): GoalDTO {
  return {
    id: goal.id,
    name: goal.name,
    category: goal.category,
    targetMoney: { amountMinor: toMoneyDTO(goal.targetAmountMinor), currency: baseCurrency },
    deadline: toDateDTO(goal.deadline),
    userId: goal.userId,
    createdAt: toDateDTO(goal.createdAt) as string,
    currentMoney: goal.currentAmountMinor !== undefined 
      ? { amountMinor: toMoneyDTO(goal.currentAmountMinor), currency: baseCurrency } 
      : undefined,
  };
}
