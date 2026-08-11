/**
 * Phase 6B: Accounts Intelligence DTO Contract
 * 
 * This DTO represents the exact data shape provided to the Accounts domain.
 * It enforces the rule: React displays financial truth; it does not calculate it.
 * 
 * Rules:
 * - No mocked connected-account/sync fields. The schema focuses on what exists.
 * - Backend owns account grouping.
 * - Backend owns trajectory calculation. Insufficient history returns 'unavailable'.
 * - No assumed actions that aren't implemented.
 */

export type AccountTrajectoryTrend = 'improving' | 'stable' | 'deteriorating' | 'unavailable';

export type AccountHealthStatus = 'healthy' | 'overdrawn' | 'needs_reconciliation' | 'missing_opening_balance';

export type ActionableState = 'active' | 'archived';

export type AccountsIntelligenceDTO = {
  // Global state for the Accounts domain
  domainState: 'ready' | 'onboarding';

  // Total Portfolio Position
  totalPosition: {
    amountMinor: number;
    currency: string; // The user's primary reporting currency
  };

  // Data Freshness
  dataFreshness: {
    status: 'current' | 'stale';
    lastUpdatedAt: string; // ISO-8601 UTC timestamp
  };

  // Grouped Accounts (Backend decides the grouping logic and ordering)
  accountGroups: Array<{
    id: string; // e.g., 'cash', 'credit', 'savings'
    label: string; // e.g., 'Cash & Equivalents', 'Credit Cards'
    order: number; // The display order
    accounts: Array<{
      id: string;
      name: string;
      type: string; // e.g., 'CHECKING', 'CREDIT_CARD'
      actionableState: ActionableState;
      
      // The balance in the account's native currency
      nativeBalance: {
        amountMinor: number;
        currency: string;
      };

      // The balance converted to the user's reporting currency (for aggregation)
      reportingBalance: {
        amountMinor: number;
        currency: string;
      };

      // Trajectory based on actual historical data (or unavailable)
      trajectory: {
        direction: AccountTrajectoryTrend;
      };

      // Domain-specific health flags
      health: {
        status: AccountHealthStatus;
        message?: string;
      };
      
      // Explicit capabilities for the frontend (do not assume functionality)
      capabilities: {
        canEdit: boolean;
        canArchive: boolean;
        canDelete: boolean;
        canTransfer: boolean; // Depends on WO-8 status
      };
    }>;
  }>;

  // The fallback list for archived accounts, separated to prevent mixing with active liquidity
  archivedAccounts: Array<{
    id: string;
    name: string;
    type: string;
    nativeBalance: {
      amountMinor: number;
      currency: string;
    };
    reportingBalance: {
      amountMinor: number;
      currency: string;
    };
    capabilities: {
      canEdit: boolean;
      canUnarchive: boolean;
      canDelete: boolean;
    };
  }>;
};
