# Risk Register

This document tracks known architectural and operational risks to the Ledger360 platform, prioritizing transparency and proactive mitigation.

| Risk ID | Description | Likelihood | Impact | Mitigation Strategy | Owner | Status |
|---------|-------------|------------|--------|---------------------|-------|--------|
| **R-01** | Balance computation bottleneck as ledger grows. | High | Medium | Introduce an Optimized Query Layer to cache snapshot balances periodically (Phase 2F). | Architecture Team | Active |
| **R-02** | Cross-currency translation drifting due to historical FX rates. | Medium | High | Lock fxRates immutably at the time of transfer creation. Do not rely on dynamic API recalculations for historical data. | Domain Team | Mitigated |
| **R-03** | Prisma migration failure causing database downtime. | Low | High | Ensure all migrations are backward compatible. Never drop columns in the same release they are deprecated. | DevOps | Active |
| **R-04** | AI categorization errors misleading user budgets. | High | Low | AI predictions must be flagged with confidence scores. High-confidence bypasses review, low-confidence requires explicit user approval. | Product Team | Active |
| **R-05** | Large CSV import timeouts on Vercel Serverless. | Medium | High | Shift heavy imports to a background queue system and use optimistic UI polling, rather than synchronous HTTP bounds. | Core Engineering | Pending |
