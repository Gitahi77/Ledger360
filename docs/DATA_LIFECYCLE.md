# Data Lifecycle Policy

As Ledger360 users accumulate years of financial history, data must be gracefully aged to protect performance and storage costs without compromising the ledger's integrity.

## Hot Data
**Definition:** Active, frequently queried records.
**Age:** Last 12 months.
**Strategy:** Kept in primary Postgres indexes. Readily available for UI rendering, dashboards, and charts.

## Warm Data
**Definition:** Historical records accessed occasionally for tax reporting or year-over-year comparisons.
**Age:** 1–5 years.
**Strategy:** Remains in primary Postgres. May be excluded from default "Recent" queries. Subject to table partitioning strategies as volume grows.

## Cold Data
**Definition:** Legacy historical records.
**Age:** 5+ years.
**Strategy:** Shifted to cold storage (e.g., compressed JSON payloads or a dedicated archival database). Not loaded into live UI unless explicitly requested via an asynchronous "Retrieve History" action.

## Archived Data
**Definition:** User deleted or sunsetted data.
**Strategy:** Offered as an explicit local export format (CSV/JSON), followed by a hard-delete from active production clusters to enforce data minimization.
