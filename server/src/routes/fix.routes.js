import express from 'express';
import { orchestrateFixAndVerify } from '../fixer/fixer.js';
import { compileAuditCertificates } from '../certifier/certifier.js';
import { buildJsonReport } from '../report/json.js';
import { store } from '../storage/store.js';
import { logger } from '../utils/logger.js';
import { runScan } from '../scanner/scanner.js';
import { validateTargetUrl } from '../security/security.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../');
const TMP_DIR = path.join(ROOT_DIR, 'data/tmp');
const DEMO_APP_DIR = path.join(ROOT_DIR, 'demo-app');

const router = express.Router();

/**
 * POST /fix { scanId, rules?, customSuggestions?, projectPath?, targetUrl? }
 */
router.post('/fix', async (req, res) => {
  try {
    const { scanId, inputType, input_type, code, approvedFixIds, rules: enabledRules, customSuggestions = {}, projectPath, targetUrl } = req.body;

    const requestedType = inputType || input_type || (code ? 'code' : null);

    // Enforce: POST /api/fix must return 400 if input_type is not "code"
    if (requestedType && requestedType !== 'code') {
      return res.status(400).json({
        error: 'Automatic source fixing is only supported for input_type = "code". Live DOM URL audits cannot be automatically fixed or downloaded as code. Please refer to the "What to change" live DOM report.'
      });
    }

    // If fixing a raw code snippet
    if (code) {
      const { analyzeAndRepairCode } = await import('../fixer/codeAnalyzer.js');
      try {
        const { language, filename } = req.body;
        const fixed = await analyzeAndRepairCode(code, { approvedFixIds, enabledRules, language, filename });
        return res.json(fixed);
      } catch (err) {
        return res.status(400).json({
          error: `Code fix failed or introduced syntax errors: ${err.message}`,
          rollback: true
        });
      }
    }

    const initialScan = store.getScan(scanId);
    if (!initialScan) {
      return res.status(404).json({ error: `Scan ID "${scanId}" not found in storage.` });
    }

    const scanType = initialScan.inputType || initialScan.input_type || initialScan.mode;
    const isUrlScan = scanType === 'url' || (initialScan.url && (initialScan.url.startsWith('http://') || initialScan.url.startsWith('https://')));
    if (isUrlScan && scanType !== 'code') {
      return res.status(400).json({
        error: 'Automatic source fixing is only supported for input_type = "code". Live DOM URL audits cannot be automatically fixed or downloaded as code. Please refer to the "What to change" live DOM report.'
      });
    }

    const effectiveTargetUrl = targetUrl || initialScan.url;
    const sourceDir = (projectPath && fs.existsSync(projectPath)) ? projectPath : DEMO_APP_DIR;
    const sandboxDir = path.join(TMP_DIR, `sandbox-${Date.now()}`);
    const backupDir = path.join(TMP_DIR, `backup-${Date.now()}`);

    const fixResult = await orchestrateFixAndVerify({
      initialScan,
      sourceDir,
      targetUrl: effectiveTargetUrl,
      sandboxDir,
      backupDir,
      enabledRules,
      customSuggestions
    });

    // Compile certificates
    const certificates = compileAuditCertificates(fixResult.verifiedFixes, initialScan);

    // Human review queue for items requiring confirmation
    const reviewQueue = certificates
      .filter(c => c.status === 'NEEDS_REVIEW')
      .map(c => ({
        fixId: c.fixId,
        certificateId: c.certificateId,
        ruleId: c.ruleId,
        wcagCriterion: c.wcagCriterion,
        file: c.targetLocation.file,
        line: c.targetLocation.line,
        currentValue: c.witnesses?.preState?.failureSummary || '',
        suggestedValue: c.details,
        userDecision: 'pending'
      }));

    // Build & save full report
    const report = buildJsonReport({
      url: effectiveTargetUrl,
      initialScan,
      postScan: fixResult.postScan,
      certificates,
      diffs: fixResult.diffs,
      reviewQueue
    });

    store.saveReport(report.reportId, report);

    res.json({
      reportId: report.reportId,
      status: fixResult.status,
      scoreBefore: fixResult.scoreBefore,
      scoreAfter: fixResult.scoreAfter,
      scoreDelta: fixResult.scoreDelta,
      diffs: fixResult.diffs,
      certificates,
      reviewQueue,
      beforeScreenshot: fixResult.beforeScreenshot,
      afterScreenshot: fixResult.afterScreenshot,
      postScan: fixResult.postScan,
      counts: {
        total: (initialScan.violations || []).length,
        certified: certificates.filter(c => c.status === 'CERTIFIED').length,
        needsReview: certificates.filter(c => c.status === 'NEEDS_REVIEW').length,
        unfixable: certificates.filter(c => c.status === 'UNFIXABLE').length
      }
    });
  } catch (err) {
    logger.error('Fix execution failed:', err);
    res.status(500).json({ error: `Remediation execution failed: ${err.message}` });
  }
});

/**
 * POST /verify { url, baselineViolations }
 * Re-scans the target URL, checks whether specified baseline violations are resolved and verifies zero regressions.
 */
router.post('/verify', async (req, res) => {
  try {
    const { url, baselineViolations = [] } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing "url" parameter.' });
    }

    const validation = validateTargetUrl(url, url.includes('localhost') || url.includes('127.0.0.1') ? 'local' : 'public');
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const postScan = await runScan(validation.sanitizedUrl);
    const beforeRuleSet = new Set(baselineViolations.map(v => typeof v === 'string' ? v : v.id));
    const postRuleSet = new Set(postScan.violations.map(v => v.id));

    const resolved = baselineViolations.filter(v => !postRuleSet.has(typeof v === 'string' ? v : v.id));
    const regressions = postScan.violations.filter(v => !beforeRuleSet.has(v.id));
    const passed = regressions.length === 0;

    res.json({
      verified: passed,
      status: passed ? 'VERIFIED' : 'REGRESSION_DETECTED',
      postScanScore: postScan.score,
      resolvedCount: resolved.length,
      regressionsCount: regressions.length,
      regressions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Verification failed:', err);
    res.status(500).json({ error: `Verification failed: ${err.message}` });
  }
});

/**
 * POST /review { reportId, fixId, action, text }
 */
router.post('/review', (req, res) => {
  try {
    const { reportId, fixId, action, text } = req.body;
    const report = store.getReport(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const item = report.reviewQueue.find(q => q.fixId === fixId);
    if (!item) {
      return res.status(404).json({ error: 'Review item not found.' });
    }

    item.userDecision = action;
    if (text) item.suggestedValue = text;

    const cert = report.certificates.find(c => c.fixId === fixId);
    if (cert) {
      if (action === 'accepted' || action === 'modified') {
        cert.status = 'CERTIFIED';
        cert.disclaimer = 'Verified by human reviewer through WCAGuard Review Queue.';
      } else if (action === 'rejected') {
        cert.status = 'UNFIXABLE';
      }
    }

    store.saveReport(reportId, report);
    res.json({ success: true, item, updatedCertificate: cert });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
