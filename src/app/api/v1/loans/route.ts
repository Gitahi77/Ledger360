import { apiRoute } from '@/lib/api/respond';
import { getLoans, addLoan } from '@/lib/actions/loans';
import { AddLoanSchema } from '@/lib/validation';

export const GET = apiRoute(
  null,
  async () => {
    return getLoans();
  }
);

export const POST = apiRoute(
  AddLoanSchema,
  async (req, { body }) => {
    await addLoan(body);
    return { success: true };
  }
);
