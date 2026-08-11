# Phase 6E Remediation Plan

Based on the findings in `accounts-audit.md`, the following remediation steps will be executed:

## 1. Fix Data Freshness Provenance (Contract Violation)
**File:** `src/lib/domain/intelligence/accounts.ts` and `src/lib/domain/services/BalanceService.ts`
- **Current State:** `lastUpdatedAt: new Date().toISOString()`
- **Remediation:** 
  1. Add `updatedAt` to `EnrichedAccountData` in `BalanceService`.
  2. In `AccountsIntelligenceOrchestrator`, calculate the latest `updatedAt` across all fetched accounts.
  3. Set `lastUpdatedAt` to that precise maximum value.

## 2. Fix Account Health Semantics (Implementation Defect)
**File:** `src/lib/domain/intelligence/accounts.ts`
- **Current State:** Any account with `balanceMinor < 0` and `allowNegativeBalance === false` is marked `overdrawn`.
- **Remediation:** 
  1. Introduce a helper to determine if an account type is a natural liability (e.g., `CREDIT_CARD`, `MORTGAGE`, `AUTO_LOAN`).
  2. If an account is a liability, `balanceMinor < 0` is its expected healthy state (a balance owed). Only flag it as `overdrawn` if its balance were to exceed a predefined limit (which we don't track yet) or just consider it always healthy for now unless explicitly over its limit. Since we lack credit limits, negative balances for liability accounts will be treated as `healthy`.

## 3. Standardize Mobile Action Menu (Implementation Defect)
**File:** `src/app/(dashboard)/accounts/AccountsClient.tsx`
- **Current State:** Uses inline flex buttons for `canEdit`, `canArchive`, `canDelete`, and `canTransfer`.
- **Remediation:**
  1. Implement a clean `...` (MoreHorizontal) Dropdown/Popover menu for mobile and desktop, or use native `<details>`/`<summary>` as a lightweight popover if Radix isn't available, or simply use `lucide-react` icons inside a dropdown container.
  2. Ensure the capability gating still applies to the menu items.

## Execution
These remediations will be applied immediately, followed by local verification to ensure Phase 6E achieves a clean final gate.
