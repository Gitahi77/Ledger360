import { apiRoute } from '@/lib/api/respond';
import { createAccount } from '@/lib/actions/accounts';
import { getAccounts } from '@/lib/queries/accounts';
import { AccountType } from '@prisma/client';
import { z } from 'zod';

const AccountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AccountType),
  currency: z.string().length(3).optional(),
  openingMinor: z.number().int().default(0),
  archived: z.boolean().optional(),
});

export const GET = apiRoute(
  null,
  async (req, { userId }) => {
    return getAccounts({ userId });
  }
);

export const POST = apiRoute(
  AccountSchema,
  async (req, { body }) => {
    return createAccount(body);
  }
);
