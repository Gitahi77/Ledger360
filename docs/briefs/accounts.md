# Phase 6A: Accounts Product Brief

## 1. Product North Star
The single job of the Accounts domain is to answer:
> **"Where is my money?"**

Accounts is the geographic map of the user's financial life. It is not a generic CRUD management page, nor is it a transaction explorer. It provides clarity on liquidity, allocation, and account health.

## 2. Questions Accounts Must Answer
A user opening Accounts should quickly understand:
1. **Where is my money currently held?** (Distribution across institutions/types).
2. **How much is available in each account?** (Liquidity).
3. **What is my total position across all accounts?** (Aggregation).
4. **Which accounts are growing or declining?** (Trajectory).
5. **Which accounts require attention?** (Health/Issues).
6. **What types of accounts do I have, and which are active or archived?**
7. **Where should I go to manage or reconcile a specific account?** (Action).

## 3. Information Hierarchy
1. **Overall Account Position:** The aggregated total of all liquid assets in the primary reporting currency.
2. **Account Health / Attention:** Domain-specific alerts (e.g., disconnected institution, overdrawn account, reconciliation needed).
3. **Account Portfolio / List:** The grouped visualization of accounts (e.g., Cash, Credit, Investments).
4. **Account-Level Information:** Name, balance, trajectory (if available), and type.
5. **Account Actions:** Deposit, withdraw, reconcile, edit, or archive. (Actions like Transfer are strictly governed by backend DTO capability flags, pending WO-8).
6. **Secondary / Detail Information:** Account number masks, interest rates, or archived status.

## 4. "Do Not Put Here" Boundary
To preserve the Ledger360 UI OS boundaries, Accounts must **not** include:
* **Detailed transaction exploration:** Belongs in Transactions.
* **Global financial attention:** Belongs in Dashboard.
* **Historical financial analysis:** Belongs in Reports.
* **Detailed budgeting:** Belongs in Budgets.
* **Detailed goal management:** Belongs in Goals.
* **Loan repayment management:** Belongs in Loans.
* **Category analysis:** Belongs in Categories.

*Accounts may expose deep-links to these domains (e.g., clicking an account flows to Transactions filtered by that account).*

## 5. Account States & Edge Cases
* **Zero accounts:** Clear onboarding flow to add the first manual or connected account.
* **One account:** Simplify the hierarchy; do not over-index on portfolio allocation charts if 100% of money is in one place.
* **Many accounts:** Robust grouping (Cash, Credit, Savings, etc.) and visual chunking.
* **Manual vs. Connected accounts:** The system currently relies on manual accounts. The UI must cleanly support manual accounts and rely strictly on the DTO; we do not mock connection statuses (like `lastSyncTime`) unless the backend actually supports them.
* **Inactive / Closed / Archived accounts:** Hidden from the primary view but accessible for historical completeness.
* **Data freshness:** Visual indicator when account data is stale. Connected-account connection failures are not represented until supported by the backend.
* **Stale account data:** Clear "Last updated" timestamps if > 24 hours.
* **Negative balance:** High-visibility warning (unless expected, e.g., Credit Cards).
* **Zero balance:** Neutral state, not an error.
* **Multiple currencies:** Show native currency at the account level, but aggregate at the portfolio level in the user's base reporting currency.
* **Duplicate accounts:** Warning if names/types are suspiciously identical.

## 6. Account Health & Attention Model
Accounts has its own domain-specific attention model, strictly isolated from the global Dashboard `attentionItems`.
* **Account-local:** Overdrawn status, manual reconciliation overdue, missing opening balances.
* **Cross-domain:** Transfers failing between accounts.
* **Dashboard-level (Do not show here unless specific to an account):** Global safe-to-spend warnings.

## 7. Data Provenance Requirements
**React displays financial truth; it does not calculate financial truth.**
The `AccountsIntelligenceDTO` must provide:
* Pre-calculated aggregated total position.
* Currency-converted values for aggregation.
* Account Grouping explicitly defined and sorted by the backend.
* Pre-calculated trends (improving/deteriorating/unavailable).
* Account health statuses.
* Boolean capability flags for UI actions (do not assume functionality).
React will purely map these DTO fields to the presentation layer.

## 8. Coffee Shop Test
A user opens Accounts while standing in a coffee shop. Within **5-10 seconds**, they must be able to determine:
1. Where their money is geographically.
2. How much they have in total (in their reporting currency).
3. Which account(s) require immediate attention (e.g., overdrawn or disconnected).
4. Where to tap to manage or reconcile a specific account.

## 9. Desktop & Mobile Product Behavior
* **Desktop:** A multi-pane or expanded list view. The portfolio allocation (charts/grouping) can sit alongside the detailed list.
* **Mobile:** A strict vertical stack. Total position at the top, followed by any health alerts, followed by compact account cards grouped by type. Actions must be swipeable or accessible via a clearly marked menu to save vertical space.

## 10. URL & Interaction Requirements
State should be URL-driven where shareable/restorable:
* `?accountId=cuid` to deep-link to a specific account's details panel.
* `?action=new` to open the "Add Account" flow.
* `?action=edit&accountId=cuid` to open the settings for a specific account.
