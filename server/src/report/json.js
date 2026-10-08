/**
 * WCAGuard JSON Report Compiler
 */

export function buildJsonReport({
  reportId,
  url,
  initialScan,
  postScan,
  certificates = [],
  diffs = [],
  reviewQueue = []
}) {
  const id = reportId || `rpt-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const certifiedCount = certificates.filter(c => c.status === 'CERTIFIED').length;
  const reviewCount = certificates.filter(c => c.status === 'NEEDS_REVIEW').length;
  const unfixableCount = certificates.filter(c => c.status === 'UNFIXABLE').length;

  return {
    reportId: id,
    timestamp,
    targetUrl: url,
    scoreSummary: {
      before: initialScan?.score ?? 0,
      after: postScan?.score ?? initialScan?.score ?? 0,
      delta: (postScan?.score ?? 0) - (initialScan?.score ?? 0)
    },
    certificationSummary: {
      totalFixes: certificates.length,
      certified: certifiedCount,
      needsReview: reviewCount,
      unfixable: unfixableCount
    },
    honestyStatement: {
      claim: 'WCAGuard adheres to strict accessibility honesty. We never claim 100% WCAG conformance.',
      principles: [
        'Only deterministic machine-checkable rules are certified.',
        'Semantic items (e.g. image descriptions, button labels) require human verification.',
        'Any change that induces regressions is rolled back automatically.'
      ]
    },
    certificates,
    diffs,
    reviewQueue,
    initialScanSummary: {
      totalViolations: initialScan?.totalViolations ?? 0,
      countsBySeverity: initialScan?.scoreDetails?.countsBySeverity ?? {},
      countsByPrinciple: initialScan?.scoreDetails?.countsByPrinciple ?? {}
    },
    postScanSummary: {
      totalViolations: postScan?.totalViolations ?? 0,
      countsBySeverity: postScan?.scoreDetails?.countsBySeverity ?? {},
      countsByPrinciple: postScan?.scoreDetails?.countsByPrinciple ?? {}
    }
  };
}
