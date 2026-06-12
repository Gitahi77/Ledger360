import { apiRoute } from '@/lib/api/respond';
import { getTransactions, addTransaction } from '@/lib/actions/transactions';
import { AddTransactionSchema } from '@/lib/validation';
import { z } from 'zod';

const GetTransactionsQuerySchema = z.object({
  period: z.string().optional(),
  type: z.string().optional(),
});

export const GET = apiRoute(
  null,
  async (req) => {
    // Parse query params safely
    const url = new URL(req.url);
    const query = GetTransactionsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    
    const period = query.success && query.data.period ? query.data.period : 'this-month';
    const type = query.success && query.data.type ? query.data.type : undefined;
    
    return getTransactions(period, type);
  }
);

export const POST = apiRoute(
  AddTransactionSchema,
  async (req, { body }) => {
    const result = await addTransaction(body);
    return { success: true, warning: result?.warning };
  }
);
