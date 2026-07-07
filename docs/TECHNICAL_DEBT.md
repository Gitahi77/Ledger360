# Technical Debt Register

A formalized tracker of deliberate engineering compromises, enabling the team to ship value today without losing sight of obligations for tomorrow.

| Debt ID | Description | Current State | Reason | Impact | Priority | Owner | Planned Phase |
|---------|-------------|---------------|--------|--------|----------|-------|---------------|
| **TD-01** | Synchronous Transfer Events | `EventBus` simply logs to console natively inside the process. | Avoiding premature introduction of Kafka/RabbitMQ. | UI waits for event processing. Events are lost if process crashes mid-emit. | Medium | Architecture | Phase 6 |
| **TD-02** | Lack of Read Replicas | All dashboard queries hit the primary DB. | Traffic is low; avoiding Postgres infrastructure complexity. | Heavy reports could slow down transactional mutations. | Low | DevOps | Post-Launch |
| **TD-03** | Monolithic Repo | UI, API, and Domain logic reside in a single Next.js repo. | Faster iteration cycles for small teams. | Build times will scale linearly with features. | Low | Core | Unknown |
| **TD-04** | Polling for Idempotency | Idempotency relies on a unique index error rather than a distributed lock. | Avoiding Redis complexity. | Two perfectly simultaneous identical requests might race, one fails with 500 instead of returning 200. | Medium | Backend | Phase 4 |
