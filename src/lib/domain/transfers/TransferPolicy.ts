import { Account } from '@prisma/client';

export class TransferPolicy {
  /**
   * Can the source account overdraft? Credit cards can always overdraft.
   */
  static canOverdraft(account: Account): boolean {
    return account.type === 'CREDIT_CARD';
  }

  static canTransfer(amountMinor: number): boolean {
    return amountMinor > 0;
  }
}
