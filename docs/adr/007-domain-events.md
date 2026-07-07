# ADR 007: Domain Events

## Status
Accepted

## Context
When a transfer occurs, several downstream systems (notifications, audits, goals, loans) need to react. Hardcoding these reactions directly into the `TransferService` creates a "God class" that requires modification every time a new feature is added.

## Decision
We will implement an Event Bus. The `TransferService` simply emits a strictly typed, First-Class Domain Event (e.g., `TransferCompletedEvent`) post-commit. Other subsystems will listen for and react to this event.

## Alternatives Considered
- Direct imperative calls (e.g., `NotificationService.send(...)` inside the Transfer block).
- Full Event Sourcing (discarded as premature optimization).

## Consequences
- Requires an `EventBus` implementation.
- Decouples services, improving maintainability.

## Future Considerations
Transitioning the local in-memory `EventBus` to a distributed queue (e.g., Google Cloud Pub/Sub) when horizontal scaling is required.
