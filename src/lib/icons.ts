import type { AccountType } from '@prisma/client'

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  // Bank
  CHECKING:      'ti-building-bank',
  SAVINGS:       'ti-piggy-bank',
  // Mobile money
  MPESA:         'ti-device-mobile-dollar',
  AIRTEL_MONEY:  'ti-device-mobile',
  // Credit
  CREDIT_CARD:   'ti-credit-card',
  // SACCOs & Chamas
  SACCO_DEPOSIT: 'ti-users',
  SACCO_LOAN:    'ti-users-minus',
  CHAMA:         'ti-users-group',
  // Loans
  MORTGAGE:      'ti-home',
  AUTO_LOAN:     'ti-car',
  // Investments
  BROKERAGE:     'ti-chart-candle',
  CRYPTO:        'ti-currency-bitcoin',
}

// Safe getter — never returns undefined, never crashes
export function getAccountIcon(type: AccountType): string {
  return ACCOUNT_TYPE_ICONS[type] ?? 'ti-wallet'
}

export const TRANSACTION_CATEGORY_ICONS: Record<string, string> = {
  // M-Pesa
  'M-Pesa Send':        'ti-device-mobile-dollar',
  'M-Pesa Receive':     'ti-device-mobile-dollar',
  'Lipa na M-Pesa':     'ti-qrcode',
  'M-Pesa Paybill':     'ti-file-invoice',
  'Fuliza':             'ti-alert-circle',
  'M-Shwari':           'ti-device-mobile',
  // Transport
  'Matatu':             'ti-bus',
  'Bodaboda':           'ti-motorbike',
  'Uber/Bolt':          'ti-car',
  // Living
  'Supermarket':        'ti-shopping-cart',
  'Utility':            'ti-plug',
  'Rent':               'ti-home',
  // Government / deductions
  'NHIF':               'ti-heart',
  'NSSF':               'ti-building-bank',
  'KRA':                'ti-receipt-tax',
  // Financial
  'SACCO':              'ti-users',
  'Chama':              'ti-users-group',
  'NSE':                'ti-chart-candle',
  'Bank Transfer':      'ti-arrows-exchange',
  'ATM Withdrawal':     'ti-cash',
  // Fallback — always safe
  'Other':              'ti-dots',
}

export function getCategoryIcon(category: string): string {
  return TRANSACTION_CATEGORY_ICONS[category] ?? 'ti-dots'
}
