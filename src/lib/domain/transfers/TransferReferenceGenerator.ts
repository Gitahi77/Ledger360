import { randomBytes } from 'crypto';
import { getNairobiNow } from '@/lib/dateUtils';

export class TransferReferenceGenerator {
  /**
   * Generates a human-readable transfer reference number.
   * Format: TRF-YYYYMMDD-XXXXXX
   * Example: TRF-20260707-1A2B3C
   */
  static generate(): string {
    const now = getNairobiNow();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = randomBytes(3).toString('hex').toUpperCase();
    return `TRF-${dateStr}-${randomHex}`;
  }
}
