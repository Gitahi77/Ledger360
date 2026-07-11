import { apiRoute } from '@/lib/api/respond';
import { addTransaction } from '@/lib/actions/transactions';
import { getTransactions } from '@/lib/queries/transactions';
import { AddTransactionSchema } from '@/lib/validation';
import { z } from 'zod';

const GetTransactionsQuerySchema = z.object({
  period: z.string().optional(),
  type: z.string().optional(),
});

export const GET = apiRoute(
  null,
  async (req, { userId }) => {
    // Parse query params safely
    const url = new URL(req.url);
    const query = GetTransactionsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    
    if (!query.success) {
      const { NextResponse } = await import('next/server');
      return NextResponse.json({ error: 'Invalid query parameters', details: query.error.flatten() }, { status: 400 });
    }
    
    const period = query.data.period ? query.data.period : 'this-month';
    const type = query.data.type ? query.data.type : undefined;
    
    return getTransactions({ userId, period, type });
  }
);

export const POST = apiRoute(
  AddTransactionSchema,
  async (req, { body }) => {
    const result = await addTransaction(body);
    return { success: true, warning: result?.warning };
  }
);
