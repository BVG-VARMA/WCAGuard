import React from 'react';
import UrlWhatToChangeReport from '../components/UrlWhatToChangeReport.jsx';
import CodeReviewFixWorkspace from '../components/CodeReviewFixWorkspace.jsx';
import PipelineStatus from '../components/PipelineStatus.jsx';
import { ScoreComparisonChart, SeverityChart } from '../components/Charts.jsx';

/**
 * Stage 3: Results Dashboard
 * Routes between:
 * 1. "React code": CodeReviewFixWorkspace (Babel AST, Review, Apply fix, Recheck, Rollback, SHA-256, PDFKit certificate)
 * 2. "URL": UrlWhatToChangeReport (NO automatic fixing, "Verified on live DOM, not source", Copy & Export-as-PDF, Re-scan Updated Webpage)
 */
export default function Results({
  scanResult,
  onApplyAllFixes,
  onApplySingleFix,
  onNavigateToReport,
  onRecheckCode,
  onRescanUrl = null,
  rescanning = false,
  fixing = false,
  fixStatusMessage = ''
}) {
  if (!scanResult) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          No Scan Results Available
        </h2>
        <p className="text-xs text-slate-500">
          Please run an audit from the Scan page first.
        </p>
      </div>
    );
  }

  const isCodeScan =
    scanResult.input_type === 'code' ||
    scanResult.mode === 'code' ||
    Boolean(scanResult.remediatedCode) ||
    (!scanResult.target_url && !scanResult.url?.startsWith('http'));

  const isUrlScan = !isCodeScan;

  return (
    <div className="space-y-6 py-2">
      {/* 6-Step Autonomous Repair Pipeline Tab */}
      <PipelineStatus activeStep={isCodeScan ? 'fix' : 'localize'} />

      {/* 1. URL SCAN WORKSPACE: What to Change Report (Live DOM only, no code fixes) */}
      {isUrlScan && (
        <UrlWhatToChangeReport
          scanResult={scanResult}
          onRescanUrl={onRescanUrl}
          rescanning={rescanning}
        />
      )}

      {/* 2. REACT CODE WORKSPACE: Full AST Pipeline & Side-by-Side Review */}
      {isCodeScan && (
        <CodeReviewFixWorkspace
          scanResult={scanResult}
          onRecheckCode={onRecheckCode}
          onNavigateToReport={onNavigateToReport}
        />
      )}
    </div>
  );
}
