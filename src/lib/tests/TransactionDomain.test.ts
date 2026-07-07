import { describe, it, expect } from 'vitest';
import { MerchantNormalizer } from '../domain/transactions/MerchantNormalizer';
import { TransactionClassifier } from '../domain/transactions/TransactionClassifier';
import { TransactionValidator } from '../domain/transactions/TransactionValidator';
import { TransactionNormalizer, RawTransaction } from '../domain/transactions/TransactionNormalizer';
import { Money } from '../domain/money/Money';

describe('Transaction Domain', () => {
  const KES = 'KES';

  describe('MerchantNormalizer', () => {
    it('normalizes known merchants correctly', () => {
      expect(MerchantNormalizer.normalize('MPESA SAFARICOM LTD')).toBe('Safaricom');
      expect(MerchantNormalizer.normalize('Safaricom Airtime')).toBe('Safaricom');
      expect(MerchantNormalizer.normalize('Zuku Internet')).toBe('Zuku');
      expect(MerchantNormalizer.normalize('Uber BV')).toBe('Uber');
    });

    it('falls back to Title Case for unknown merchants', () => {
      expect(MerchantNormalizer.normalize('java house')).toBe('Java House');
      expect(MerchantNormalizer.normalize('  MAMAS  CAFE ')).toBe('Mamas Cafe');
    });
  });

  describe('TransactionClassifier', () => {
    it('trusts explicit category hints with 100% confidence', () => {
      const res = TransactionClassifier.classify('Safaricom', 'expense', 'Business Expenses');
      expect(res.categoryNameHint).toBe('Business Expenses');
      expect(res.merchantConfidence).toBe(100);
      expect(res.categoryConfidence).toBe(100);
    });

    it('uses heuristic mapping if no explicit hint is given', () => {
      const res = TransactionClassifier.classify('Zuku', 'expense');
      expect(res.categoryNameHint).toBe('Utilities');
      expect(res.merchantConfidence).toBe(90);
      expect(res.categoryConfidence).toBe(75);
    });

    it('returns low confidence for completely unknown merchants', () => {
      const res = TransactionClassifier.classify('Unknown Random Shop', 'expense');
      expect(res.categoryNameHint).toBeUndefined();
      expect(res.merchantConfidence).toBe(50);
      expect(res.categoryConfidence).toBe(0);
    });
  });

  describe('TransactionValidator', () => {
    it('rejects zero or negative amounts', () => {
      expect(() => TransactionValidator.validate(Money.zero(KES), new Date())).toThrow(/positive/);
      expect(() => TransactionValidator.validate(Money.fromMajor(-10, KES), new Date())).toThrow(/positive/);
    });

    it('allows valid past dates and current dates', () => {
      expect(() => TransactionValidator.validate(Money.fromMajor(10, KES), new Date())).not.toThrow();
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30); // 30 days ago
      expect(() => TransactionValidator.validate(Money.fromMajor(10, KES), pastDate)).not.toThrow();
    });

    it('rejects dates significantly in the future (timezone wiggle room allowed)', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days future
      expect(() => TransactionValidator.validate(Money.fromMajor(10, KES), futureDate)).toThrow(/future/);
    });
  });

  describe('TransactionNormalizer (Pipeline)', () => {
    it('pushes a raw transaction through the entire pipeline correctly', () => {
      const raw: RawTransaction = {
        accountId: 'acc_1',
        amount: Money.fromMajor(1000, KES),
        date: new Date(),
        rawMerchantName: ' KPLC TOKEN ',
        type: 'expense'
      };

      const verified = TransactionNormalizer.process(raw);
      expect(verified.normalizedMerchantName).toBe('KPLC');
      expect(verified.classification.categoryNameHint).toBe('Utilities');
      expect(verified.isVerified).toBe(false); // Because KPLC confidence is 90 & 75 (<80)
    });
  });
});
