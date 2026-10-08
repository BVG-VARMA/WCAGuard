/**
 * WCAGuard Score Engine
 * Computes deterministic accessibility scores from normalized violations.
 * Formula: score = 100 - (critical*10 + serious*5 + moderate*2 + minor*1), min 0.
 */

export function calculateScore(violations = []) {
  const countsBySeverity = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };

  const countsByPrinciple = {
    Perceivable: 0,
    Operable: 0,
    Understandable: 0,
    Robust: 0
  };

  violations.forEach(v => {
    const impact = (v.impact || 'minor').toLowerCase();
    const nodeCount = v.nodes?.length || 1;

    if (countsBySeverity[impact] !== undefined) {
      countsBySeverity[impact] += nodeCount;
    } else {
      countsBySeverity.minor += nodeCount;
    }

    const principle = v.principle || 'Perceivable';
    countsByPrinciple[principle] = (countsByPrinciple[principle] || 0) + nodeCount;
  });

  const deduction =
    (countsBySeverity.critical * 10) +
    (countsBySeverity.serious * 5) +
    (countsBySeverity.moderate * 2) +
    (countsBySeverity.minor * 1);

  const rawScore = 100 - deduction;
  const score = Math.max(0, Math.min(100, rawScore));
  const totalViolations = Object.values(countsBySeverity).reduce((a, b) => a + b, 0);

  return {
    score,
    rawScore,
    deduction,
    totalViolations,
    countsBySeverity,
    countsByPrinciple,
    timestamp: new Date().toISOString()
  };
}
