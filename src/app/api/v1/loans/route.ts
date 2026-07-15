import { apiRoute } from '@/lib/api/respond';
import { addLoan } from '@/lib/actions/loans';
import { getLoans } from '@/lib/queries/loans';
import { AddLoanSchema } from '@/lib/validation';

export const GET = apiRoute(
  null,
  async (req, { userId }) => {
    return getLoans({ userId });
  }
);

export const POST = apiRoute(
  AddLoanSchema,
  async (req, { body }) => {
    await addLoan({ payload: body });
    return { success: true };
  }
);
