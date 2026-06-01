'use server';

import { requireAuth } from './_auth';
import { prisma } from '@/lib/prisma';

export async function createCategory(data: { name: string; type: string; icon?: string }) {
  const user = await requireAuth();

  const existing = await prisma.category.findUnique({
    where: {
      name_userId: { name: data.name, userId: user.id },
    },
  });

  if (existing) {
    throw new Error('A category with this name already exists.');
  }

  return prisma.category.create({
    data: {
      ...data,
      userId: user.id,
    },
  });
}

export async function editCategory(id: string, data: { name: string; type: string; icon?: string }) {
  const user = await requireAuth();

  // Check if trying to rename to an existing category
  const existing = await prisma.category.findFirst({
    where: {
      name: data.name,
      userId: user.id,
      id: { not: id },
    },
  });

  if (existing) {
    throw new Error('A category with this name already exists.');
  }

  const result = await prisma.category.updateMany({
    where: { id, userId: user.id },
    data: {
      name: data.name,
      type: data.type,
      icon: data.icon,
    },
  });

  if (result.count === 0) {
    throw new Error('Category not found or access denied.');
  }
}

export async function deleteCategory(id: string) {
  const user = await requireAuth();

  // First check if it's used in transactions or budgets
  const inUse = await prisma.category.findFirst({
    where: {
      id,
      userId: user.id,
      OR: [
        { transactions: { some: {} } },
        { budgets: { some: {} } },
      ],
    },
    include: {
      _count: {
        select: { transactions: true, budgets: true },
      },
    },
  });

  if (inUse && (inUse._count.transactions > 0 || inUse._count.budgets > 0)) {
    throw new Error(`Cannot delete category in use by ${inUse._count.transactions} transactions and ${inUse._count.budgets} budgets.`);
  }

  const result = await prisma.category.deleteMany({
    where: { id, userId: user.id },
  });

  if (result.count === 0) {
    throw new Error('Category not found or access denied.');
  }
}
