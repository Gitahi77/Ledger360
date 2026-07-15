# Capacity Model & Scalability Architecture

## Introduction

This document outlines the capacity planning model for Ledger360. As we shift from an application to a platform, we need baseline metrics to understand scalability ceilings and potential bottlenecks.

## Service Level Objectives (SLOs)

We define the following operational thresholds for Ledger360:

### Availability
* **Uptime:** 99.9% (approx. 43.8 minutes of acceptable downtime per month)

### Performance & Latency
* **Dashboard Read:** P95 < 300 ms, P99 < 600 ms
* **Transaction Creation:** P95 < 200 ms
* **Reporting Queries:** P95 < 1000 ms

### Reliability
* **API Errors (5xx):** < 0.1%
* **Failed Requests (Timeouts):** < 0.5%

## Load Profiles & Personas

To test this model, we use synthetic workloads based on user personas:
1. **Light User:** 2 accounts, ~100 transactions, 5 categories.
2. **Moderate User:** 5 accounts, ~2,000 transactions, 15 categories.
3. **Heavy User:** 10 accounts, 50,000 transactions, 50 categories.

## Known Architecture Thresholds

Based on the baseline metrics, the following thresholds dictate infrastructure scaling:
* **Connection Pool Exhaustion:** If `poolWaitCount` spikes during high load, Prisma connection limits need to be scaled alongside Postgres `max_connections`, or a bounce-pool like PgBouncer must be tuned.
* **N+1 Query Bottlenecks:** Queries generating over 5 normalized Prisma hashes per request require refactoring using Prisma `include` or DataLoader patterns.
* **Large Payloads:** Dashboard responses exceeding 100KB imply serialization bloat and require API pagination or DTO minimization.

## Future Mitigations (Phase 4B+)

If benchmarking indicates failing SLOs, the following techniques will be introduced:
* **Edge Caching:** Caching static lookups (Categories) at the edge.
* **Query Memoization:** React cache for repetitive component-level queries.
* **Database Indexing:** Adding composite indexes on frequently filtered columns (e.g., `accountId_date_type`).
