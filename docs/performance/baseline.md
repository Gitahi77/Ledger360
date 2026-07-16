# Performance Baseline
**Version:** v4.2 Baseline
**Date:** July 15, 2026
**Status:** Pre-Optimization

## Overview
This document represents the performance baseline for Ledger360. All future optimizations must measure their improvements against these figures.

## Current Metrics
- **Write Operations (e.g., addTransaction):**
  - **Success Rate:** 100.00% (No dropped requests)
  - **p(95) Latency:** 9.69 seconds
  - **Median Latency:** 9.08 seconds
  - **Minimum Latency:** 3.48 seconds

## Primary Bottleneck
The system's write paths are currently bounded by **synchronous, full-history aggregations**. On every transaction creation, `BalanceService.getEnrichedAccounts` recalculates the complete balance history of the user from the `Transaction` and `Transfer` tables. Under concurrency (e.g., 50 VUs), this causes severe database CPU/IO spikes.

For detailed evidence, refer to:
- [Slow Queries](./slow-queries.md)
- [Benchmark History (2026-07-15)](./benchmark-history/2026-07-15.md)
