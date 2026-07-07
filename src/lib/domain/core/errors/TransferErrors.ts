import { DomainError } from "./DomainError";

export class InsufficientFundsError extends DomainError {
  constructor(accountId: string) {
    super(`Account ${accountId} has insufficient funds for this transfer.`, "INSUFFICIENT_FUNDS");
  }
}

export class CurrencyMismatchError extends DomainError {
  constructor() {
    super("Source and destination accounts must have the same currency for intra-currency transfers.", "CURRENCY_MISMATCH");
  }
}

export class TransferPolicyViolationError extends DomainError {
  constructor(ruleName: string, reason: string) {
    super(`Transfer rejected by policy ${ruleName}: ${reason}`, "POLICY_VIOLATION");
  }
}

export class DuplicateTransferError extends DomainError {
  constructor(idempotencyKey: string) {
    super(`A transfer with idempotency key ${idempotencyKey} already exists.`, "DUPLICATE_TRANSFER");
  }
}
