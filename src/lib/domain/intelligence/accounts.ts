import { BalanceService, EnrichedAccountData } from '../services/BalanceService';
import { 
  AccountsIntelligenceDTO, 
  AccountHealthStatus, 
  AccountTrajectoryTrend 
} from '../../types/accounts-intelligence';
import { ACCOUNT_GROUPS } from '../../accounts';

export class AccountsIntelligenceOrchestrator {
  static async build(userId: string, userCurrency?: string | null): Promise<AccountsIntelligenceDTO> {
    const accounts = await BalanceService.getEnrichedAccounts(userId);

    const reportingCurrency = userCurrency || 'KES';
    const activeAccounts = accounts.filter((a: EnrichedAccountData) => !a.archived);
    const archivedAccountsList = accounts.filter((a: EnrichedAccountData) => a.archived);

    // 1. Calculate Total Position
    let totalPositionMinor = 0;
    for (const acc of activeAccounts) {
      // Future: apply FX conversion here if acc.currency !== reportingCurrency
      // For now, assume 1:1 if no FX engine exists, but ideally user.currency aligns
      totalPositionMinor += Number(acc.balanceMinor);
    }

    // 2. Build Account Groups
    // We enforce an authoritative display order defined by the backend
    const groupOrder = [
      'Cash',
      'Bank',
      'Mobile Money',
      'Credit',
      'Loans',
      'Investments',
      'SACCOs & Chamas',
      'Other'
    ];

    // Group the active accounts
    const groupedMap = new Map<string, EnrichedAccountData[]>();
    for (const group of groupOrder) {
      groupedMap.set(group, []);
    }

    for (const acc of activeAccounts) {
      let foundGroup = 'Other';
      for (const [groupName, types] of Object.entries(ACCOUNT_GROUPS)) {
        if ((types as string[]).includes(acc.type)) {
          foundGroup = groupName;
          break;
        }
      }
      const list = groupedMap.get(foundGroup) || groupedMap.get('Other')!;
      list.push(acc);
    }

    const accountGroups: AccountsIntelligenceDTO['accountGroups'] = [];
    let orderIndex = 0;

    for (const groupName of groupOrder) {
      const groupAccounts = groupedMap.get(groupName);
      if (groupAccounts && groupAccounts.length > 0) {
        accountGroups.push({
          id: groupName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          label: groupName,
          order: orderIndex++,
          accounts: groupAccounts.map(acc => this.mapToAccountDTO(acc, reportingCurrency))
        });
      }
    }

    // 3. Determine Domain State
    const domainState = activeAccounts.length === 0 ? 'onboarding' : 'ready';

    // 4. Determine Data Freshness
    // Find the most recent updatedAt across active accounts
    let latestUpdate = new Date(0);
    for (const acc of activeAccounts) {
      if (acc.updatedAt > latestUpdate) {
        latestUpdate = acc.updatedAt;
      }
    }
    const lastUpdatedAtStr = latestUpdate.getTime() > 0 ? latestUpdate.toISOString() : new Date().toISOString();

    return {
      domainState,
      totalPosition: {
        amountMinor: totalPositionMinor,
        currency: reportingCurrency
      },
      dataFreshness: {
        status: 'current',
        lastUpdatedAt: lastUpdatedAtStr
      },
      accountGroups,
      archivedAccounts: archivedAccountsList.map((acc: EnrichedAccountData) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        nativeBalance: {
          amountMinor: Number(acc.balanceMinor),
          currency: acc.currency
        },
        reportingBalance: {
          amountMinor: Number(acc.balanceMinor),
          currency: reportingCurrency
        },
        capabilities: {
          canEdit: true,
          canUnarchive: true,
          canDelete: true, // Only if 0 transactions, handled downstream or disabled on tap
        }
      }))
    };
  }

  private static mapToAccountDTO(
    acc: EnrichedAccountData, 
    reportingCurrency: string
  ): AccountsIntelligenceDTO['accountGroups'][0]['accounts'][0] {
    
    // Determine Health
    let healthStatus: AccountHealthStatus = 'healthy';
    let healthMessage: string | undefined = undefined;

    // Liability accounts naturally carry negative balances
    const isLiability = ['CREDIT_CARD', 'MORTGAGE', 'AUTO_LOAN'].includes(acc.type);

    if (acc.balanceMinor < 0 && !acc.allowNegativeBalance && !isLiability) {
      healthStatus = 'overdrawn';
      healthMessage = 'Account is overdrawn.';
    } else if (acc.openingMinor === 0 && acc.balanceMinor === 0) {
      // Just a heuristics for missing opening balance if entirely empty, 
      // but maybe safe to leave healthy unless we know it's a new connected account
      // We will rely on healthy for now unless explicitly needed.
    }

    // Determine Trajectory
    // Currently, we don't have enough history queried to determine trajectory.
    const trajectoryDirection: AccountTrajectoryTrend = 'unavailable';

    return {
      id: acc.id,
      name: acc.name,
      type: acc.type,
      actionableState: 'active',
      nativeBalance: {
        amountMinor: Number(acc.balanceMinor),
        currency: acc.currency
      },
      reportingBalance: {
        amountMinor: Number(acc.balanceMinor), // Future: FX conversion
        currency: reportingCurrency
      },
      trajectory: {
        direction: trajectoryDirection
      },
      health: {
        status: healthStatus,
        message: healthMessage
      },
      capabilities: {
        canEdit: true,
        canArchive: true,
        canDelete: true,
        canTransfer: false // Strictly gated (WO-8 dependent)
      }
    };
  }
}
