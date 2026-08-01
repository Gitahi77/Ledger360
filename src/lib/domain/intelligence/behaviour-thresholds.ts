export const BehaviourThresholds = {
  /** 
   * Minimum proportion of spending in a single category/merchant
   * to trigger a 'concentration' warning (e.g. 0.3 = 30%) 
   */
  categoryConcentration: 0.30,
  
  /** 
   * Number of standard deviations above the mean to flag a transaction as an outlier
   */
  outlierStdDev: 2,
  
  /** 
   * Minimum number of transactions required to calculate variance and outliers
   */
  minTransactionsForOutliers: 3,

  /**
   * Minimum number of transactions to analyze rhythm (e.g. weekend vs weekday)
   */
  minTransactionsForRhythm: 5,

  /** 
   * Multiplier to determine if weekend spending dominates weekday spending
   * (e.g. 1.5 means weekend spending must be 50% higher than weekday spending)
   */
  weekendDominationMultiplier: 1.5
} as const;
