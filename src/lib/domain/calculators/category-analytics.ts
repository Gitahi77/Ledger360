// src/lib/domain/calculators/category-analytics.ts

export type MonthlyCategoryData = {
  month: string; // e.g., '2026-08'
  amountMinor: number;
};

export type CategoryAnalyticsResult = {
  threeMonthAverageMinor: number;
  sixMonthAverageMinor: number;
  monthOverMonthChangePct: number;
  velocityLabel: string;
  volatilityLabel: string;
  trendLabel: string;
  stabilityScore: number;
  history: MonthlyCategoryData[];
};

/**
 * Calculates analytics for a category based on up to 6 months of historical data.
 * @param history Array of monthly totals in chronological order (oldest to newest).
 *                Must include the current month as the last element.
 */
export function calculateCategoryAnalytics(history: MonthlyCategoryData[]): CategoryAnalyticsResult {
  const n = history.length;
  
  if (n === 0) {
    return {
      threeMonthAverageMinor: 0,
      sixMonthAverageMinor: 0,
      monthOverMonthChangePct: 0,
      velocityLabel: 'Insufficient data',
      volatilityLabel: 'Insufficient data',
      trendLabel: 'Insufficient data',
      stabilityScore: 0,
      history: [],
    };
  }

  // 1. Averages
  const sixMonthTotal = history.reduce((sum, h) => sum + h.amountMinor, 0);
  const sixMonthAverageMinor = Math.round(sixMonthTotal / n);

  const threeMonthData = history.slice(Math.max(0, n - 3));
  const threeMonthTotal = threeMonthData.reduce((sum, h) => sum + h.amountMinor, 0);
  const threeMonthAverageMinor = Math.round(threeMonthTotal / threeMonthData.length);

  // 2. Month-over-Month Change
  let monthOverMonthChangePct = 0;
  if (n >= 2) {
    const currentMonth = history[n - 1].amountMinor;
    const prevMonth = history[n - 2].amountMinor;
    if (prevMonth === 0) {
      monthOverMonthChangePct = currentMonth > 0 ? 100 : 0;
    } else {
      monthOverMonthChangePct = ((currentMonth - prevMonth) / prevMonth) * 100;
    }
  }

  // 3. Volatility (Standard Deviation over up to 6 months)
  let volatilityLabel = 'Insufficient data';
  let cv = 0; // Coefficient of Variation
  
  if (n >= 3) {
    const mean = sixMonthAverageMinor;
    if (mean === 0) {
      cv = 0;
      volatilityLabel = 'Very Stable';
    } else {
      const variance = history.reduce((sum, h) => sum + Math.pow(h.amountMinor - mean, 2), 0) / n;
      const stdDev = Math.sqrt(variance);
      cv = stdDev / mean;

      if (cv < 0.15) volatilityLabel = 'Very Stable';
      else if (cv < 0.30) volatilityLabel = 'Stable';
      else if (cv < 0.60) volatilityLabel = 'Variable';
      else volatilityLabel = 'Highly Variable';
    }
  }

  // 4. Trend (Slope of last 3-6 months)
  let trendLabel = 'Insufficient data';
  let slope = 0;
  if (n >= 3) {
    // Simple linear regression to find slope
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = history[i].amountMinor;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }
    slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Normalize slope relative to the mean to get a percentage change per month trend
    const normalizedSlope = sixMonthAverageMinor === 0 ? 0 : slope / sixMonthAverageMinor;

    if (normalizedSlope > 0.15) trendLabel = 'Rapidly Rising';
    else if (normalizedSlope > 0.05) trendLabel = 'Rising';
    else if (normalizedSlope > -0.05) trendLabel = 'Stable';
    else if (normalizedSlope > -0.15) trendLabel = 'Falling';
    else trendLabel = 'Rapidly Falling';
  }

  // 5. Velocity
  // Compares current month's pacing to the previous month's pacing or the average
  let velocityLabel = 'Insufficient data';
  if (n >= 2) {
    const current = history[n - 1].amountMinor;
    // We compare against the 3-month average instead of just last month, to smooth out velocity
    const baseline = threeMonthAverageMinor;
    if (baseline === 0) {
      velocityLabel = current > 0 ? 'Spending faster than usual' : 'On normal pace';
    } else {
      const diff = (current - baseline) / baseline;
      if (diff > 0.1) velocityLabel = 'Spending faster than usual';
      else if (diff < -0.1) velocityLabel = 'Spending slower than expected';
      else velocityLabel = 'On normal pace';
    }
  }

  // 6. Stability Score (0-100)
  // Highly penalized by high volatility and rapid rising trends.
  let stabilityScore = 100;
  if (n >= 3) {
    // Volatility penalty (up to 50 points)
    const volPenalty = Math.min(50, cv * 100);
    
    // Trend penalty (up to 30 points for rising trends)
    let trendPenalty = 0;
    const normalizedSlope = sixMonthAverageMinor === 0 ? 0 : slope / sixMonthAverageMinor;
    if (normalizedSlope > 0) {
      trendPenalty = Math.min(30, normalizedSlope * 200);
    } else if (normalizedSlope < 0) {
      // Falling trends actually increase stability slightly (reward)
      stabilityScore += Math.min(10, Math.abs(normalizedSlope) * 100);
    }
    
    // Velocity penalty (up to 20 points)
    let velocityPenalty = 0;
    if (n >= 2) {
      const current = history[n - 1].amountMinor;
      const baseline = threeMonthAverageMinor;
      if (baseline > 0) {
        const diff = (current - baseline) / baseline;
        if (diff > 0) velocityPenalty = Math.min(20, diff * 100);
      }
    }

    stabilityScore = Math.max(0, Math.min(100, Math.round(stabilityScore - volPenalty - trendPenalty - velocityPenalty)));
  } else {
    stabilityScore = 0; // Not enough data to be "stable"
  }

  return {
    threeMonthAverageMinor,
    sixMonthAverageMinor,
    monthOverMonthChangePct: Math.round(monthOverMonthChangePct),
    velocityLabel,
    volatilityLabel,
    trendLabel,
    stabilityScore,
    history,
  };
}
