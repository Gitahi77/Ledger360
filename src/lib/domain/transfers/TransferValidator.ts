import { Account } from '@prisma/client';

export class TransferValidator {
  /**
   * Throws an error if the transfer is invalid.
   */
  static validateAccounts(fromAccount: Account | null | undefined, toAccount: Account | null | undefined) {
    if (!fromAccount) {
      throw new Error('Please choose a valid source account.');
    }

    if (fromAccount.archived) {
      throw new Error('Cannot transfer from an archived account.');
    }

    if (toAccount) {
      if (toAccount.archived) {
        throw new Error('Cannot transfer to an archived account.');
      }

      if (fromAccount.id === toAccount.id) {
        throw new Error('Cannot transfer to the same account.');
      }

      if (fromAccount.currency !== toAccount.currency) {
        throw new Error('Multi-currency transfers are not yet supported. Both accounts must have the same currency.');
      }
    }
  }
}
