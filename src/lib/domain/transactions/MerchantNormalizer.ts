/**
 * Normalizes raw merchant strings into canonical names.
 * Preserves the original raw string in the pipeline for audit and machine learning.
 */
export class MerchantNormalizer {
  private static readonly rules: Array<{ pattern: RegExp; canonical: string }> = [
    { pattern: /mpesa\s+safaricom/i, canonical: 'Safaricom' },
    { pattern: /safaricom\s+airtime/i, canonical: 'Safaricom' },
    { pattern: /safaricom\s+ltd/i, canonical: 'Safaricom' },
    { pattern: /kplc|kenya\s+power/i, canonical: 'KPLC' },
    { pattern: /zuku\s+internet/i, canonical: 'Zuku' },
    { pattern: /uber\s+trip|uber\s+bv/i, canonical: 'Uber' },
    { pattern: /bolt|taxify/i, canonical: 'Bolt' },
    { pattern: /naivas/i, canonical: 'Naivas' },
    { pattern: /carrefour/i, canonical: 'Carrefour' },
    { pattern: /quickmart|quick\s+mart/i, canonical: 'Quickmart' },
    { pattern: /netflix/i, canonical: 'Netflix' },
    { pattern: /spotify/i, canonical: 'Spotify' },
  ];

  static normalize(rawName: string): string {
    const trimmed = rawName.trim();
    for (const rule of this.rules) {
      if (rule.pattern.test(trimmed)) {
        return rule.canonical;
      }
    }
    // Fallback: title-case the first word or perform a basic cleanup
    return this.toTitleCase(trimmed.replace(/\s+/g, ' '));
  }

  private static toTitleCase(str: string): string {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}
