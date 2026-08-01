import type { MoneyDTO } from './domain';
import type { 
  IntelligenceModule, 
  TimelineEvent,
  Observation,
  Insight,
  Recommendation
} from './intelligence';

export type TransactionSnapshot = {
  id: string;
  name: string;
  baseMoney: MoneyDTO;
  type: string;
  date: string;
  category?: { id: string; name: string; icon: string | null } | null;
};

export interface IntelligenceMetrics {
  netCashFlow: MoneyDTO;
  totalExpenses: MoneyDTO;
  totalIncome: MoneyDTO;
  largestExpense: TransactionSnapshot | null;
  largestIncome: TransactionSnapshot | null;
  averageSpend: MoneyDTO;
  transactionCount: number;
  averageTransactionsPerDay: number;
}

export interface TransactionsIntelligenceDTO extends IntelligenceModule<
  IntelligenceMetrics,
  Observation[],
  Insight,
  Recommendation,
  TimelineEvent[]
> {
  visualizations: {
    rollingDailySpend: Array<{ date: string; amount: MoneyDTO }>;
    categoryTimeline?: Array<{ category: string; data: Array<{ date: string; amount: MoneyDTO }> }>;
  };
}
