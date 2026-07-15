# Slow Endpoints Baseline
**Date:** July 15, 2026

## 1. `POST /api/trpc/addTransaction` (or Server Action `addTransaction`)
- **Action Type:** Write
- **Measured Latency:** p(95) 9.69s under load
- **Reason:** Validates transactions by fully enriching account history (`BalanceService.getEnrichedAccounts`).
- **Phase 4B Target:** < 500ms under 50 VU load

## 2. `GET /` (Dashboard Initial Load)
- **Action Type:** Read
- **Measured Latency:** Cascading degradation during high write concurrency.
- **Reason:** The dashboard fetches `Account` and `Transaction` lists. Under heavy write loads, the database connection pool is starved, causing these normally fast queries to queue up and degrade.
- **Phase 4B Target:** Keep read queries isolated or optimize writes so they don't lock the connection pool.
