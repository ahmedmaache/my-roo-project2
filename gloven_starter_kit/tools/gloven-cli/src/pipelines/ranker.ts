import type { ScoredApplication, RankedApplication, DecisionBand } from '../types.js';
import { logger } from '../observability/logger.js';

/**
 * Ranking and banding pipeline
 * Calculates weighted totals and assigns bands
 */

/**
 * Calculate weighted total from criterion scores
 * Weights: Team(25%) + Problem(20%) + Insight(15%) + Traction(15%) + Timing(10%) + Fit(10%) + Impact(5%)
 */
function calculateWeightedTotal(scored: ScoredApplication): number {
  const s = scored.score;
  
  // Each criterion is 1-5, we need to convert to 0-100 scale with weights
  const weights = {
    team: 0.25,
    problem_size: 0.20,
    insight: 0.15,
    traction: 0.15,
    timing: 0.10,
    fit: 0.10,
    impact: 0.05,
  };

  // Convert 1-5 scores to 0-100 scale: (score - 1) / 4 * 100
  const normalize = (score: number) => ((score - 1) / 4) * 100;

  const weighted = 
    normalize(s.team.score) * weights.team +
    normalize(s.problem_size.score) * weights.problem_size +
    normalize(s.insight.score) * weights.insight +
    normalize(s.traction.score) * weights.traction +
    normalize(s.timing.score) * weights.timing +
    normalize(s.fit.score) * weights.fit +
    normalize(s.impact.score) * weights.impact;

  return Math.round(weighted * 10) / 10; // Round to 1 decimal
}

/**
 * Determine decision band based on score and red flags
 */
function determineBand(score: number, hasRedFlags: boolean): DecisionBand {
  // Red flags automatically make it NO_GO
  if (hasRedFlags) {
    return 'NO_GO';
  }

  // Bands: GO (≥70), WAITLIST (60-69), NO_GO (<60)
  if (score >= 70) {
    return 'GO';
  } else if (score >= 60) {
    return 'WAITLIST';
  } else {
    return 'NO_GO';
  }
}

/**
 * Rank and band scored applications
 */
export function rankApplications(scored: ScoredApplication[]): RankedApplication[] {
  logger.info(`Ranking ${scored.length} applications`);

  // Calculate weighted totals and bands
  const ranked: RankedApplication[] = scored.map(s => {
    const weightedTotal = calculateWeightedTotal(s);
    const hasRedFlags = s.score.red_flags && s.score.red_flags.length > 0;
    const band = determineBand(weightedTotal, hasRedFlags);

    return {
      ...s,
      score: {
        ...s.score,
        weighted_total_0to100: weightedTotal,
      },
      band,
      rank: 0, // Will be set after sorting
    };
  });

  // Sort by weighted total descending
  ranked.sort((a, b) => b.score.weighted_total_0to100 - a.score.weighted_total_0to100);

  // Assign ranks
  ranked.forEach((app, index) => {
    app.rank = index + 1;
  });

  // Log distribution
  const distribution = ranked.reduce((acc, app) => {
    acc[app.band] = (acc[app.band] || 0) + 1;
    return acc;
  }, {} as Record<DecisionBand, number>);

  logger.info('Ranking complete', {
    distribution,
    avgScore: (ranked.reduce((sum, app) => sum + app.score.weighted_total_0to100, 0) / ranked.length).toFixed(1),
  });

  return ranked;
}

/**
 * Filter applications by band
 */
export function filterByBand(ranked: RankedApplication[], band: DecisionBand): RankedApplication[] {
  return ranked.filter(app => app.band === band);
}

/**
 * Get top N applications
 */
export function getTopN(ranked: RankedApplication[], n: number): RankedApplication[] {
  return ranked.slice(0, n);
}