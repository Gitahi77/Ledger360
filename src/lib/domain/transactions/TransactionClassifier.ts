export interface ClassificationResult {
  categoryId?: string;
  categoryNameHint?: string; // e.g. "Utilities"
  merchantConfidence: number; // 0-100
  categoryConfidence: number; // 0-100
}

/**
 * Assigns categories and confidence scores to normalized transactions.
 * In the future, this can call out to an AI service or rely on user-defined rules.
 */
export class TransactionClassifier {
  // Simple heuristic dictionary for now
  private static readonly categoryHints: Record<string, string> = {
    'Safaricom': 'Communication',
    'KPLC': 'Utilities',
    'Zuku': 'Utilities',
    'Uber': 'Transport',
    'Bolt': 'Transport',
    'Naivas': 'Groceries',
    'Carrefour': 'Groceries',
    'Quickmart': 'Groceries',
    'Netflix': 'Entertainment',
    'Spotify': 'Entertainment',
  };

  static classify(normalizedMerchant: string, type: 'income' | 'expense' = 'expense', originalCategoryHint?: string): ClassificationResult {
    // If the user or import explicitly provided a category, trust it fully
    if (originalCategoryHint) {
      return {
        categoryNameHint: originalCategoryHint,
        merchantConfidence: 100, // Exact match on their input
        categoryConfidence: 100,
      };
    }

    if (type === 'income') {
      // Very basic income rules (could be expanded)
      if (normalizedMerchant === 'Safaricom') {
        return { categoryNameHint: 'Refunds', merchantConfidence: 90, categoryConfidence: 60 };
      }
      return { merchantConfidence: 50, categoryConfidence: 0 };
    }

    // Try heuristic matching for expenses
    const suggestedCategory = this.categoryHints[normalizedMerchant];
    if (suggestedCategory) {
      return {
        categoryNameHint: suggestedCategory,
        merchantConfidence: 90, // We matched a known rule
        categoryConfidence: 75, // Category might be wrong (e.g. bought hardware at Safaricom instead of airtime)
      };
    }

    // Completely unknown
    return {
      merchantConfidence: 50, // Just a guess based on the raw string
      categoryConfidence: 0,
    };
  }
}
