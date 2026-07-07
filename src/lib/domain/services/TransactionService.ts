import { TransactionNormalizer, RawTransaction } from '../transactions/TransactionNormalizer';
import { Money } from '../money/Money';

export class TransactionService {
  /**
   * Processes a new incoming transaction (e.g. from UI or Import).
   * It pushes it through the normalization pipeline before returning
   * the payload ready for the Repository.
   */
  static processNewTransaction(
    accountId: string,
    amount: Money,
    type: 'income' | 'expense',
    merchantName: string,
    date: Date,
    notes?: string,
    categoryHint?: string
  ) {
    const raw: RawTransaction = {
      accountId,
      amount,
      type,
      rawMerchantName: merchantName,
      date,
      notes,
      originalCategoryHint: categoryHint
    };

    const verified = TransactionNormalizer.process(raw);

    return {
      persistencePayload: {
        accountId: verified.accountId,
        baseAmountMinor: BigInt(verified.amount.minorUnits),
        currency: verified.amount.currency,
        type: verified.type,
        name: verified.rawMerchantName, // Preserve raw in DB
        note: verified.notes,
        date: verified.date,
        categoryHint: verified.classification.categoryNameHint,
        // The repository will need to resolve classification.categoryNameHint to a real categoryId
      },
      metadata: {
        normalizedMerchantName: verified.normalizedMerchantName,
        merchantConfidence: verified.classification.merchantConfidence,
        categoryConfidence: verified.classification.categoryConfidence,
        isVerified: verified.isVerified,
        categoryHint: verified.classification.categoryNameHint
      }
    };
  }

  /**
   * Enriches an existing database transaction with dynamic normalization metadata.
   */
  static enrichExistingTransaction(dbTx: any, currency: string) {
    const raw: RawTransaction = {
      accountId: dbTx.accountId,
      amount: Money.fromMinor(Number(dbTx.baseAmountMinor), currency),
      type: dbTx.type,
      rawMerchantName: dbTx.name,
      date: dbTx.date,
      notes: dbTx.note || undefined,
      originalCategoryHint: dbTx.category?.name // If we joined category
    };

    const verified = TransactionNormalizer.process(raw);

    return {
      dbTx,
      metadata: {
        normalizedMerchantName: verified.normalizedMerchantName,
        merchantConfidence: verified.classification.merchantConfidence,
        categoryConfidence: verified.classification.categoryConfidence,
        isVerified: verified.isVerified,
      }
    };
  }
}
