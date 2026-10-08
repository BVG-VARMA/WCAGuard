import { runScan } from '../server/src/scanner/scanner.js';
import { orchestrateFixAndVerify } from '../server/src/fixer/fixer.js';
import { compileAuditCertificates } from '../server/src/certifier/certifier.js';
import { buildJsonReport } from '../server/src/report/json.js';
import { store } from '../server/src/storage/store.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const targetUrl = process.argv[2] || 'http://localhost:5173';
const demoAppDir = path.join(ROOT_DIR, 'demo-app');
const sandboxDir = path.join(ROOT_DIR, 'data/tmp', `seed-sandbox-${Date.now()}`);
const backupDir = path.join(ROOT_DIR, 'data/tmp', `seed-backup-${Date.now()}`);

async function runSeed() {
  console.log('================================================================');
  console.log('🛡️  WCAGuard - Automated WCAG Remediation & Certification Engine');
  console.log('    "Find it. Fix it. Prove it."');
  console.log('================================================================\n');

  console.log(`[1/4] 🔍 Scanning Target: ${targetUrl}...`);
  let initialScan;
  try {
    initialScan = await runScan(targetUrl);
  } catch (err) {
    console.error(`\n❌ Failed to scan ${targetUrl}: ${err.message}`);
    console.error('Make sure the demo-app is running: npm run demo\n');
    process.exit(1);
  }

  console.log(`      ✓ Scan Completed in Playwright headless Chromium.`);
  console.log(`      • Baseline Score: ${initialScan.score} / 100`);
  console.log(`      • Total Violations: ${initialScan.totalViolations}`);
  console.log(`      • Critical: ${initialScan.scoreDetails.countsBySeverity.critical}, Serious: ${initialScan.scoreDetails.countsBySeverity.serious}, Moderate: ${initialScan.scoreDetails.countsBySeverity.moderate}, Minor: ${initialScan.scoreDetails.countsBySeverity.minor}\n`);

  console.log('[2/4] ⚙️  Applying AST Fixers in Safe Sandbox...');
  const fixResult = await orchestrateFixAndVerify({
    initialScan,
    sourceDir: demoAppDir,
    targetUrl,
    sandboxDir,
    backupDir
  });

  console.log(`      ✓ Parsed & Rewrote JSX/HTML AST nodes.`);
  console.log(`      • Files Modified: ${fixResult.changedFiles.join(', ')}`);
  console.log(`      • Score Before: ${fixResult.scoreBefore} / 100`);
  console.log(`      • Score After:  ${fixResult.scoreAfter} / 100 (+${fixResult.scoreDelta} pts)\n`);

  console.log('[3/4] 📜 Generating Cryptographic Audit Certificates...');
  const certificates = compileAuditCertificates(fixResult.verifiedFixes, initialScan);

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

  const report = buildJsonReport({
    url: targetUrl,
    initialScan,
    postScan: fixResult.postScan,
    certificates,
    diffs: fixResult.diffs,
    reviewQueue
  });

  store.saveReport(report.reportId, report);
  console.log(`      ✓ Stored Audit Report: data/reports/${report.reportId}.json\n`);

  console.log('================================================================');
  console.log('🏆 SUMMARY OF AUDIT:');
  console.log(`   Baseline Score:     ${initialScan.score} / 100`);
  console.log(`   Remediated Score:   ${fixResult.scoreAfter} / 100 (+${fixResult.scoreDelta} pts)`);
  console.log(`   CERTIFIED Fixes:    ${certificates.filter(c => c.status === 'CERTIFIED').length}`);
  console.log(`   NEEDS REVIEW:       ${certificates.filter(c => c.status === 'NEEDS_REVIEW').length} (Human confirmation queue)`);
  console.log(`   UNFIXABLE:          ${certificates.filter(c => c.status === 'UNFIXABLE').length}`);
  console.log('================================================================\n');
}

runSeed().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
