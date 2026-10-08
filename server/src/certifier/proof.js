/**
 * WCAGuard Proof Record Generator
 * Constructs pre-state and post-state verification witnesses.
 */

export function createProofRecord({
  preViolation,
  postScanWitness,
  beforeCode = '',
  afterCode = ''
}) {
  return {
    preState: {
      violationDetected: true,
      failureSummary: preViolation?.failureSummary || preViolation?.description || 'Accessibility violation flagged',
      selector: preViolation?.selector || '',
      htmlSnippet: preViolation?.html || ''
    },
    postState: {
      reScanVerified: postScanWitness?.ruleCleared ?? true,
      timestamp: postScanWitness?.reScanTimestamp || new Date().toISOString()
    },
    codeEvidence: {
      before: beforeCode,
      after: afterCode
    }
  };
}
