# Data Lifecycle Policy

As Ledger360 users accumulate years of financial history, data must be gracefully aged to protect performance and storage costs without compromising the ledger's integrity.

## Hot Data
**Definition:** Current month, frequently accessed.
**Strategy:** Kept in memory or cache where applicable. Optimizes immediate dashboard rendering and validation.

## Warm Data
**Definition:** Current year.
**Strategy:** Stored in primary Postgres with comprehensive indexes. Quickly available for year-to-date reporting and recent search.

## Cold Data
**Definition:** Older years.
**Strategy:** Archive optimized. Shifted to slower storage or compressed formats as it is rarely accessed except for explicit historical lookups.

## Historical Data
**Definition:** Read-only legacy data.
**Strategy:** Partition eligible. Different ages of financial data have different access patterns, making this a candidate for table partitioning (e.g., in Phase 4F), but only if empirical evidence justifies the complexity.
