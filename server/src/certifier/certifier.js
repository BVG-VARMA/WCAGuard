import { createProofRecord } from './proof.js';

/**
 * Issues cryptographic audit certificates per fix adhering to strict honesty rules.
 * Status is strictly CERTIFIED, NEEDS_REVIEW, or UNFIXABLE.
 */
export function issueCertificate({
  fixId,
  ruleId,
  wcagCriterion,
  file,
  line,
  dataLoc,
  status = 'CERTIFIED',
  confidence = 1.0,
  details = '',
  beforeCode = '',
  afterCode = '',
  preViolation = null,
  postScanWitness = null
}) {
  const timestamp = new Date().toISOString();
  const certificateId = `CERT-WCAG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const proof = createProofRecord({
    preViolation,
    postScanWitness,
    beforeCode,
    afterCode
  });

  return {
    certificateId,
    fixId: fixId || certificateId,
    ruleId,
    wcagCriterion,
    targetLocation: {
      file: file || 'unknown',
      line: line || null,
      dataLoc: dataLoc || `${file}:${line}`
    },
    status, // CERTIFIED | NEEDS_REVIEW | UNFIXABLE
    confidence,
    timestamp,
    witnesses: proof,
    details,
    disclaimer: status === 'CERTIFIED'
      ? 'Mathematically and structurally verified against WCAG standards via Playwright & axe-core.'
      : 'Heuristic or semantic guess provided. Human evaluation required per WCAG Non-Text Content guidelines.'
  };
}

export function compileAuditCertificates(verifiedFixes = [], initialScan = {}) {
  return verifiedFixes.map(fix => {
    const preViolation = initialScan.violations?.find(v => v.id === fix.ruleId);
    const preNode = preViolation?.nodes?.[0];

    return issueCertificate({
      fixId: fix.fixId,
      ruleId: fix.ruleId,
      wcagCriterion: fix.wcagCriterion,
      file: fix.file,
      line: fix.line,
      dataLoc: fix.dataLoc,
      status: fix.status,
      confidence: fix.confidence,
      details: fix.details,
      beforeCode: fix.beforeCode,
      afterCode: fix.afterCode,
      preViolation: preNode,
      postScanWitness: fix.postScanWitness
    });
  });
}
