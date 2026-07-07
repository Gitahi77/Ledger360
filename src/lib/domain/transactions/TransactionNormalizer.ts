import { Money } from '../money/Money';
import { MerchantNormalizer } from './MerchantNormalizer';
import { TransactionClassifier, ClassificationResult } from './TransactionClassifier';
import { TransactionValidator } from './TransactionValidator';

export interface RawTransaction {
  accountId: string;
  date: Date;
  amount: Money;
  type: 'income' | 'expense';
  rawMerchantName: string;
  notes?: string;
  originalCategoryHint?: string;
}

export interface VerifiedTransaction extends RawTransaction {
  normalizedMerchantName: string;
  classification: ClassificationResult;
  isVerified: boolean;
}

export class TransactionNormalizer {
  /**
   * Pushes a raw transaction through the entire normalization pipeline:
   * Validation -> Normalization -> Classification -> Verification.
   */
  static process(raw: RawTransaction): VerifiedTransaction {
    // 1. Validate domain rules
    TransactionValidator.validate(raw.amount, raw.date);

    // 2. Normalize merchant
    const normalizedMerchantName = MerchantNormalizer.normalize(raw.rawMerchantName);
    
    // 3. Classify and score
    const classification = TransactionClassifier.classify(normalizedMerchantName, raw.type, raw.originalCategoryHint);
    
    // 4. Mark verification state based on confidence
    // High confidence implies automatic verification. Low requires user review.
    const isVerified = classification.categoryConfidence >= 80 && classification.merchantConfidence >= 80;

    return {
      ...raw,
      normalizedMerchantName,
      classification,
      isVerified
    };
  }
}
