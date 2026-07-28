export type IntentAction = 'navigate' | 'transaction' | 'insight' | 'system' | 'unknown';

export interface ResolvedIntent {
  action: IntentAction;
  target?: string; // e.g., '/transactions/new', '/goals'
  parameters?: Record<string, any>;
  confidence: number;
}

/**
 * The Intent Router.
 * Parses natural language input and resolves it into executable system actions.
 * In the future, this is backed by an LLM or NLP. For now, it uses pattern matching.
 */
export class IntentRouter {
  static resolve(query: string): ResolvedIntent {
    const text = query.toLowerCase().trim();

    if (!text) {
      return { action: 'unknown', confidence: 0 };
    }

    // 1. Transaction Intents
    if (text.match(/i got paid|salary|income/)) {
      return { action: 'transaction', target: 'income', confidence: 95 };
    }
    if (text.match(/coffee|rent|insurance|netflix|house/)) {
      return { action: 'transaction', target: 'expense', confidence: 80 };
    }
    if (text.match(/move money|transfer/)) {
      return { action: 'transaction', target: 'transfer', confidence: 90 };
    }

    // 2. Navigation Intents
    if (text.match(/dashboard|today/)) {
      return { action: 'navigate', target: '/', confidence: 100 };
    }
    if (text.match(/story|transactions/)) {
      return { action: 'navigate', target: '/transactions', confidence: 100 };
    }
    if (text.match(/wealth|invest/)) {
      return { action: 'navigate', target: '/investments', confidence: 100 };
    }
    if (text.match(/goals|save/)) {
      return { action: 'navigate', target: '/goals', confidence: 90 };
    }

    // 3. Insight Intents
    if (text.match(/can i buy this|safe to spend/)) {
      return { action: 'insight', target: 'safe-to-spend', confidence: 90 };
    }
    if (text.match(/how much did i waste|overspending/)) {
      return { action: 'insight', target: 'cash-flow', confidence: 85 };
    }

    return { action: 'unknown', confidence: 0 };
  }
}
