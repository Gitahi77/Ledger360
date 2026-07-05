import { describe, it, expect } from 'vitest';
import { toMinor, toMajor, assertMinor } from '@/lib/money';

describe('Money Conversion', () => {
  describe('toMinor', () => {
    it('handles standard conversions correctly', () => {
      expect(toMinor(12.50)).toBe(1250);
      expect(toMinor(1)).toBe(100);
      expect(toMinor(0)).toBe(0);
    });

    it('handles negative values correctly', () => {
      expect(toMinor(-12.50)).toBe(-1250);
      expect(toMinor(-0.01)).toBe(-1);
    });

    it('rounds edge cases to avoid floating-point drift (e.g. 0.1 + 0.2)', () => {
      // 0.1 + 0.2 is exactly 0.30000000000000004 in standard IEEE 754
      expect(toMinor(0.1 + 0.2)).toBe(30); 
    });

    it('handles large values without overflow/drift', () => {
      expect(toMinor(1_000_000.55)).toBe(100_000_055);
      expect(toMinor(-1_000_000.55)).toBe(-100_000_055);
    });
  });

  describe('toMajor', () => {
    it('handles standard conversions correctly', () => {
      expect(toMajor(1250)).toBe(12.50);
      expect(toMajor(100)).toBe(1);
      expect(toMajor(0)).toBe(0);
    });

    it('handles negative values correctly', () => {
      expect(toMajor(-1250)).toBe(-12.50);
      expect(toMajor(-1)).toBe(-0.01);
    });

    it('handles large values', () => {
      expect(toMajor(100_000_055)).toBe(1_000_000.55);
    });
  });

  describe('assertMinor', () => {
    it('does not throw on safe integers', () => {
      expect(() => assertMinor(1250)).not.toThrow();
      expect(() => assertMinor(0)).not.toThrow();
      expect(() => assertMinor(-1250)).not.toThrow();
    });


  });
});
