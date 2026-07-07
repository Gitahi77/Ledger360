export interface DomainEvent {
  eventId: string;
  occurredAt: Date;
  eventName: string;
}

export interface AccountCreatedEvent extends DomainEvent {
  eventName: 'AccountCreated';
  payload: {
    accountId: string;
    userId: string;
    currency: string;
    initialBalanceMinor: number;
  };
}

// Future events placeholders:
// export interface TransactionCreatedEvent extends DomainEvent { ... }
// export interface TransferCompletedEvent extends DomainEvent { ... }
// export interface LoanRepaidEvent extends DomainEvent { ... }
