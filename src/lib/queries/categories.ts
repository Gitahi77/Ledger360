
import { requireAuth } from '../actions/_auth';
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






