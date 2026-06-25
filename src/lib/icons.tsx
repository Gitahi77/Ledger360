import React from 'react';
import type { AccountType } from '@prisma/client';
import {
  Landmark, PiggyBank, Smartphone, CreditCard, Users, UserMinus,
  Home, Car, CandlestickChart, Bitcoin, Wallet,
  QrCode, Receipt, AlertCircle, Bus, Bike, ShoppingCart, Plug,
  Heart, ArrowRightLeft, Banknote, MoreHorizontal, LucideIcon
} from 'lucide-react';

export const ACCOUNT_TYPE_ICONS: Record<AccountType, LucideIcon> = {
  CHECKING: Landmark,
  SAVINGS: PiggyBank,
  MPESA: Smartphone,
  AIRTEL_MONEY: Smartphone,
  CREDIT_CARD: CreditCard,
  SACCO_DEPOSIT: Users,
  SACCO_LOAN: UserMinus,
  CHAMA: Users,
  MORTGAGE: Home,
  AUTO_LOAN: Car,
  BROKERAGE: CandlestickChart,
  CRYPTO: Bitcoin,
};

export function DynamicAccountIcon({ type, className, style, size = 20 }: { type: AccountType, className?: string, style?: React.CSSProperties, size?: number }) {
  const Icon = ACCOUNT_TYPE_ICONS[type] || Wallet;
  return <Icon className={className} style={style} size={size} strokeWidth={2} />;
}

export const TRANSACTION_CATEGORY_ICONS: Record<string, LucideIcon> = {
  'M-Pesa Send': Smartphone,
  'M-Pesa Receive': Smartphone,
  'Lipa na M-Pesa': QrCode,
  'M-Pesa Paybill': Receipt,
  'Fuliza': AlertCircle,
  'M-Shwari': Smartphone,
  'Matatu': Bus,
  'Bodaboda': Bike,
  'Uber/Bolt': Car,
  'Supermarket': ShoppingCart,
  'Utility': Plug,
  'Rent': Home,
  'NHIF': Heart,
  'NSSF': Landmark,
  'KRA': Receipt,
  'SACCO': Users,
  'Chama': Users,
  'NSE': CandlestickChart,
  'Bank Transfer': ArrowRightLeft,
  'ATM Withdrawal': Banknote,
  'Other': MoreHorizontal,
};

export function DynamicCategoryIcon({ category, className, style, size = 20 }: { category: string, className?: string, style?: React.CSSProperties, size?: number }) {
  const Icon = TRANSACTION_CATEGORY_ICONS[category] || MoreHorizontal;
  return <Icon className={className} style={style} size={size} strokeWidth={2} />;
}
