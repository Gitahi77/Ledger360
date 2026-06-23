import type { AccountType } from '@prisma/client'

export const ACCOUNT_GROUPS: Record<string, AccountType[]> = {
  'Mobile Money':    ['MPESA', 'AIRTEL_MONEY'],
  'Bank':            ['CHECKING', 'SAVINGS'],
  'Credit':          ['CREDIT_CARD'],
  'SACCOs & Chamas': ['SACCO_DEPOSIT', 'CHAMA'],
  'Loans':           ['SACCO_LOAN', 'MORTGAGE', 'AUTO_LOAN'],
  'Investments':     ['BROKERAGE', 'CRYPTO'],
}

// Reverse lookup — safe, no undefined
export function getAccountGroup(type: AccountType): string {
  for (const [group, types] of Object.entries(ACCOUNT_GROUPS)) {
    if ((types as string[]).includes(type)) return group
  }
  return 'Other'
}
