import { requireAuth } from './_auth';
import { prisma } from '@/lib/prisma';

import { z } from 'zod';

const CategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string(),
  icon: z.string().optional(),
});

const DeleteSchema = z.object({
  id: z.string().cuid(),
});

export async function createCategory(rawData: unknown) {
  'use server';
  const user = await requireAuth();

  try {
    const parsed = CategorySchema.safeParse(rawData);
    if (!parsed.success) return { error: 'Invalid input' };
    const data = parsed.data;

    const existing = await prisma.category.findUnique({
      where: {
        name_userId: { name: data.name, userId: user.id },
      },
    });

    if (existing) {
      return { error: 'A category with this name already exists.' };
    }

    const result = await prisma.category.create({
      data: {
        ...data,
        userId: user.id,
      },
    });
    return { success: true, category: result };
  } catch (error) {
    console.error('[createCategory]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editCategory(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();

  try {
    const parsedId = DeleteSchema.safeParse({ id });
    const parsedData = CategorySchema.safeParse(rawData);
    if (!parsedId.success || !parsedData.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;
    const data = parsedData.data;

    // Check if trying to rename to an existing category
    const existing = await prisma.category.findFirst({
      where: {
        name: data.name,
        userId: user.id,
        id: { not: validId },
      },
    });

    if (existing) {
      return { error: 'A category with this name already exists.' };
    }

    const result = await prisma.category.updateMany({
      where: { id: validId, userId: user.id },
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon,
      },
    });

    if (result.count === 0) {
      return { error: 'Category not found or access denied.' };
    }

    return { success: true };
  } catch (error) {
    console.error('[editCategory]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteCategory(id: string) {
  'use server';
  const user = await requireAuth();

  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) return { error: 'Invalid input' };
    const validId = parsedId.data.id;

    // First check if it's used in transactions or budgets
    const inUse = await prisma.category.findFirst({
      where: {
        id: validId,
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
      return { error: `Cannot delete category in use by ${inUse._count.transactions} transactions and ${inUse._count.budgets} budgets.` };
    }

    const result = await prisma.category.deleteMany({
      where: { id: validId, userId: user.id },
    });

    if (result.count === 0) {
      return { error: 'Category not found or access denied.' };
    }

    return { success: true };
  } catch (error) {
    console.error('[deleteCategory]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
