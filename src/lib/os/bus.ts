export type EventType =
  | 'IncomeRecorded'
  | 'ExpenseRecorded'
  | 'GoalFunded'
  | 'LoanPaid'
  | 'BudgetExceeded'
  | 'BudgetRecovered'
  | 'InvestmentBought'
  | 'InvestmentDropped'
  | 'SubscriptionDetected'
  | 'TransferCompleted';

export interface FinancialEvent<T = Record<string, unknown>> {
  id: string;
  type: EventType;
  timestamp: string;
  payload: T;
  userId: string;
}

type EventHandler = (event: FinancialEvent<any>) => void | Promise<void>;

/**
 * A lightweight, in-memory event bus.
 * In a real distributed system, this would be backed by Kafka, Pub/Sub, or Redis Streams.
 * Here, it decouples the UI/mutations from the Intelligence Engines (Memory, Narrative, etc).
 */
class EventBus {
  private listeners: Map<EventType, EventHandler[]> = new Map();

  subscribe(type: EventType, handler: EventHandler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
    
    return () => this.unsubscribe(type, handler);
  }

  unsubscribe(type: EventType, handler: EventHandler) {
    const handlers = this.listeners.get(type);
    if (!handlers) return;
    this.listeners.set(
      type,
      handlers.filter((h) => h !== handler)
    );
  }

  async publish<T>(event: FinancialEvent<T>) {
    // 1. Run global wildcards (if any)
    // 2. Run specific type listeners
    const handlers = this.listeners.get(event.type) || [];
    
    // Using Promise.allSettled to ensure one failing listener doesn't crash others
    await Promise.allSettled(handlers.map((handler) => handler(event)));
  }
}

export const financialEventBus = new EventBus();
