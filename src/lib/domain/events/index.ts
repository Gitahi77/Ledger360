export type DomainEvent = 
  | { type: 'TransferCompleted'; payload: { transferId: string; referenceNumber: string } }
  | { type: 'LoanRepaid'; payload: { loanId: string; amountMinor: number } }
  | { type: 'GoalFunded'; payload: { goalId: string; amountMinor: number } }
  | { type: 'AccountOverdrawn'; payload: { accountId: string; currentBalanceMinor: number } };

export class EventBus {
  /**
   * Dispatches a domain event.
   * This must be called AFTER the database transaction has successfully committed.
   */
  static async dispatch(event: DomainEvent): Promise<void> {
    // In the future, this could publish to Pub/Sub, Kafka, or trigger async jobs.
    // For now, we simply log the event emission.
    console.log(`[EVENT_BUS] Dispatching Domain Event: ${event.type}`, event.payload);
  }
}
