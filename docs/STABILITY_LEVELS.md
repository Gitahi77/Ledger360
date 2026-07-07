# Stability Levels

Every module within Ledger360 must advertise its maturity to set clear expectations for reliability, testing coverage, and architectural rigidity.

| Level | Definition | Examples |
|-------|------------|----------|
| **Institutional** | Rigorously tested, property-fuzzed, invariant-checked. Code is frozen or requires immense justification to alter. | `Transfers`, `Money` |
| **Stable** | Production-ready, fully tested via unit and integration suites. Safe for daily use. | `Accounts`, `Transactions`, `Budgets` |
| **Beta** | Functionally complete but undergoing edge-case testing. May have architectural shifts based on user feedback. | `Loans`, `Goals`, `AI Categorization` |
| **Experimental** | Rapidly prototyped. Unstable APIs, prone to rewrite. Use with caution. | `Insights`, `Webhooks` |
