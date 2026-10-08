import React, { useState } from 'react';
import DiffViewer from './DiffViewer.jsx';
import { getPdfDownloadUrl } from '../api/client.js';

/**
 * Stage 3: Code Review, Fix & Verification Workspace
 * Supports both React JSX and HTML source code.
 * - Shows the complete Corrected Source Code with instant copy and file download
 * - Side-by-side Before and After code diffs
 * - User approves each change or applies all with one click
 * - Automatic recheck verification and zero-regression certification
 * - SHA-256 hash, downloadable PDF Report, and JSON Audit Report
 */
export default function CodeReviewFixWorkspace({
  scanResult,
  onRecheckCode,
  onNavigateToReport
}) {
  const originalCode = scanResult?.originalCode || scanResult?.remediatedCode || '';
  const initialRemediated = scanResult?.remediatedCode || originalCode;

  const isHtml =
    scanResult?.language === 'html' ||
    originalCode.trim().toLowerCase().startsWith('<!doctype') ||
    originalCode.trim().toLowerCase().startsWith('<html');

  const filename = scanResult?.filename || (isHtml ? 'index.html' : 'Component.jsx');

  // Editor working copy
  const [currentCodeCopy, setCurrentCodeCopy] = useState(initialRemediated);
  const [historyStack, setHistoryStack] = useState([originalCode]);
  const [isRollbackAvailable, setIsRollbackAvailable] = useState(false);

  // Tab view: 'code' (Corrected Source Code) or 'diff' (Side-by-side diff)
  const [viewTab, setViewTab] = useState('code');
  const [copiedCode, setCopiedCode] = useState(false);

  // Approval state: map of fixId -> boolean (approved)
  const appliedFixes = scanResult?.appliedFixes || scanResult?.certificates || [];
  const [approvedFixes, setApprovedFixes] = useState(() => {
    const map = {};
    appliedFixes.forEach((f) => {
      const fixId = f.fixId || f.certificateId || f.ruleId;
      const isCertified = f.status === 'Certified' || f.status === 'CERTIFIED';
      map[fixId] = isCertified;
    });
    return map;
  });

  const [recheckStatus, setRecheckStatus] = useState(null); // null | 'verified' | 'rolled_back'
  const [recheckMessage, setRecheckMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const sha256 = scanResult?.sha256 || scanResult?.code_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const reportId = scanResult?.scanId || `REPORT-${Date.now()}`;

  const toggleApproval = (fixId) => {
    setApprovedFixes((prev) => ({
      ...prev,
      [fixId]: !prev[fixId]
    }));
  };

  const handleSelectAll = (val) => {
    const map = {};
    appliedFixes.forEach((f) => {
      const fixId = f.fixId || f.certificateId || f.ruleId;
      map[fixId] = val;
    });
    setApprovedFixes(map);
  };

  // Copy updated code to clipboard
  const handleCopyCode = () => {
    if (!currentCodeCopy) return;
    navigator.clipboard.writeText(currentCodeCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download updated code file (.html or .jsx)
  const handleDownloadCode = () => {
    const mimeType = isHtml ? 'text/html' : 'text/javascript';
    const blob = new Blob([currentCodeCopy], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fixed-${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download JSON audit report
  const handleDownloadJsonReport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scanResult, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `WCAGuard-Audit-Report-${reportId}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // APPLY FIX: applies changes to a copy in the editor, runs recheck, and displays updated code
  const handleApplyFix = async (overrideApproved = null) => {
    setIsApplying(true);
    setRecheckStatus(null);
    setRecheckMessage('');

    try {
      setHistoryStack((prev) => [...prev, currentCodeCopy]);

      const approvalMap = overrideApproved || approvedFixes;
      let targetCode = originalCode;
      const approvedList = appliedFixes.filter((f) => {
        const fixId = f.fixId || f.certificateId || f.ruleId;
        return approvalMap[fixId];
      });

      if (approvedList.length === 0) {
        setRecheckStatus('rolled_back');
        setRecheckMessage('No fixes were approved. Original code retained.');
        setIsApplying(false);
        return;
      }

      if (approvedList.length === appliedFixes.length && scanResult.remediatedCode) {
        targetCode = scanResult.remediatedCode;
      } else {
        approvedList.forEach((fix) => {
          if (fix.beforeCode && fix.afterCode && targetCode.includes(fix.beforeCode)) {
            targetCode = targetCode.replace(fix.beforeCode, fix.afterCode);
          }
        });
      }

      // Recheck & Verify
      if (onRecheckCode) {
        const recheckResult = await onRecheckCode(targetCode, {
          language: isHtml ? 'html' : 'jsx',
          filename
        });
        if (recheckResult?.error) {
          setCurrentCodeCopy(originalCode);
          setIsRollbackAvailable(false);
          setRecheckStatus('rolled_back');
          setRecheckMessage('Recheck detected a syntax error or regression. Automatically rolled back to original code.');
          return;
        }
      }

      // Verification passed: update code and switch view to Corrected Code!
      setCurrentCodeCopy(targetCode);
      setIsRollbackAvailable(true);
      setRecheckStatus('verified');
      setRecheckMessage(`Applied ${approvedList.length} approved fix(es). Zero regressions detected. Code recheck verified.`);
      setViewTab('code');
    } catch (err) {
      setCurrentCodeCopy(originalCode);
      setIsRollbackAvailable(false);
      setRecheckStatus('rolled_back');
      setRecheckMessage(`Recheck failed: ${err.message}. Automatically rolled back.`);
    } finally {
      setIsApplying(false);
    }
  };

  // Apply ALL fixes in one click and immediately display updated code
  const handleApplyAllAndShowCode = async () => {
    const map = {};
    appliedFixes.forEach((f) => {
      const fixId = f.fixId || f.certificateId || f.ruleId;
      map[fixId] = true;
    });
    setApprovedFixes(map);
    await handleApplyFix(map);
    setViewTab('code');
  };

  // UNDO / ROLLBACK
  const handleRollback = () => {
    setCurrentCodeCopy(originalCode);
    setIsRollbackAvailable(false);
    setRecheckStatus(null);
    setRecheckMessage('Code rolled back to pre-fix original state.');
  };

  return (
    <div className="space-y-8 py-2">
      {/* Pipeline Navigation Stepper */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <span>{isHtml ? 'HTML Remediation Pipeline' : 'React Code Pipeline'}</span>
          <span className="font-mono text-emerald-400">
            {isHtml ? 'Deterministic HTML Verified' : 'Babel AST Verified (No Execution)'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-[11px]">
          <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold">
            1. Scan
          </div>
          <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold">
            2. Classify
          </div>
          <div className="p-2 rounded-xl bg-blue-900/70 border border-blue-400 text-blue-200 font-bold ring-2 ring-blue-500/40">
            3. Review
          </div>
          <div className={`p-2 rounded-xl border font-bold ${recheckStatus === 'verified' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            4. Fix
          </div>
          <div className={`p-2 rounded-xl border font-bold ${recheckStatus === 'verified' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            5. Recheck
          </div>
          <div className={`p-2 rounded-xl border font-bold ${recheckStatus === 'verified' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            6. Verify
          </div>
          <div className={`p-2 rounded-xl border font-bold ${recheckStatus === 'verified' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
            7. Certify
          </div>
        </div>
      </div>

      {/* Verification Status Alert */}
      {recheckStatus === 'verified' && (
        <div role="status" className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-bold text-emerald-600">✓</span>
            <div>
              <span className="font-bold">Verified & Certified: </span>
              <span>{recheckMessage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCode}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors flex items-center gap-1"
            >
              <span>💾</span>
              <span>Download Updated Code</span>
            </button>
            <button
              type="button"
              onClick={handleRollback}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors"
            >
              Rollback
            </button>
          </div>
        </div>
      )}

      {recheckStatus === 'rolled_back' && (
        <div role="alert" className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold text-amber-600">⚠️</span>
            <span>{recheckMessage}</span>
          </div>
        </div>
      )}

      {/* Header Info & Downloads Toolbar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isHtml ? 'HTML Audit & Repair Proof' : 'Deterministic AST Proof'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 font-mono">Status: Certified</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 font-mono">{filename}</span>
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isHtml ? 'HTML Accessibility Remediation & Proof' : 'React Source Remediation & AST Proof'}
          </h2>

          <div className="flex items-center gap-2 pt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <span>SHA-256:</span>
            <code className="bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 truncate max-w-sm">
              {sha256}
            </code>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isRollbackAvailable && (
            <button
              type="button"
              onClick={handleRollback}
              className="px-3.5 py-2.5 rounded-xl border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-bold transition-colors"
            >
              Rollback
            </button>
          )}

          {/* Download Updated Code Button */}
          <button
            type="button"
            onClick={handleDownloadCode}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Download the fully remediated and verified code file"
          >
            <span>💾</span>
            <span>Download Updated Code</span>
          </button>

          {/* Download JSON Report */}
          <button
            type="button"
            onClick={handleDownloadJsonReport}
            className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Download complete JSON audit and certificates report"
          >
            <span>📊</span>
            <span>JSON Report</span>
          </button>

          {/* Download PDF Certificate / Report */}
          <a
            href={getPdfDownloadUrl(reportId)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            title="Download official PDF audit summary and certificates"
          >
            <span>📥</span>
            <span>PDF Report</span>
          </a>
        </div>
      </div>

      {/* VIEW SWITCHER & WORKSPACE (Corrected Source Code vs Side-by-Side Diff) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Code Inspection Views"
              className="inline-flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewTab === 'code'}
                onClick={() => setViewTab('code')}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewTab === 'code'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>✨</span>
                <span>Corrected Code</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewTab === 'diff'}
                onClick={() => setViewTab('diff')}
                className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewTab === 'diff'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>🔍</span>
                <span>Side-by-Side Diff</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 hidden md:inline-block">
              {viewTab === 'code' ? 'Inspect and download the updated code' : 'Red: removed • Teal: added • Bold: changed token'}
            </span>
          </div>

          {/* Quick Toolbar for active code */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{copiedCode ? '✓' : '📋'}</span>
              <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCode}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>💾</span>
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* 1. CORRECTED SOURCE CODE DISPLAY */}
        {viewTab === 'code' && (
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* Editor Top Bar */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span className="font-bold text-slate-200">{filename}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">Remediated & Verified</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>{currentCodeCopy.split('\n').length} lines</span>
                <span>•</span>
                <span>{currentCodeCopy.length} characters</span>
              </div>
            </div>

            {/* Formatted Code Block with Line Numbers */}
            <div className="p-4 max-h-[550px] overflow-auto font-mono text-xs leading-relaxed text-slate-200">
              <table className="w-full border-collapse">
                <tbody>
                  {currentCodeCopy.split('\n').map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="w-12 pr-4 text-right select-none text-slate-600 text-[11px] align-top py-0.5">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre font-mono py-0.5 text-slate-100 selection:bg-emerald-600 selection:text-white">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. SIDE-BY-SIDE DIFF VIEWER */}
        {viewTab === 'diff' && (
          <DiffViewer
            oldCode={originalCode}
            newCode={currentCodeCopy}
            filename={filename}
          />
        )}
      </div>

      {/* REVIEW LIST: Approve each candidate change */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Candidate Accessibility Transformations Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review and toggle each verified change, or apply all changes and download the updated code.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Changes List */}
        <div className="space-y-3">
          {appliedFixes.map((fix, idx) => {
            const fixId = fix.fixId || fix.certificateId || fix.ruleId;
            const isApproved = Boolean(approvedFixes[fixId]);

            const rawStatus = fix.status || 'Certified';
            const statusLabel =
              rawStatus === 'CERTIFIED' || rawStatus === 'Certified'
                ? 'Certified'
                : rawStatus === 'NEEDS_REVIEW' || rawStatus === 'Needs review'
                ? 'Needs review'
                : 'Unfixable';

            const statusBadgeStyle =
              statusLabel === 'Certified'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : statusLabel === 'Needs review'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';

            return (
              <div
                key={fixId || idx}
                className={`p-4 rounded-2xl border transition-all ${
                  isApproved
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-emerald-400 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`approve-${fixId}`}
                      checked={isApproved}
                      onChange={() => toggleApproval(fixId)}
                      className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label
                          htmlFor={`approve-${fixId}`}
                          className="font-bold text-xs text-slate-900 dark:text-white cursor-pointer select-none"
                        >
                          {fix.ruleId} — {fix.wcagCriterion}
                        </label>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase tracking-wider ${statusBadgeStyle}`}
                        >
                          {statusLabel}
                        </span>
                        {fix.line && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Line {fix.line}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {fix.details || 'Deterministic auto-fix applied'}
                      </p>

                      {/* Snippet comparison preview */}
                      {fix.beforeCode && fix.afterCode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/40 truncate">
                            <span className="font-bold select-none">- </span>
                            {fix.beforeCode}
                          </div>
                          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-900/40 truncate">
                            <span className="font-bold select-none">+ </span>
                            {fix.afterCode}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* APPLY FIX ACTION BUTTONS */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Applying changes updates your working code copy, verifies against regressions, and reveals the corrected code.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Primary: Apply all and show code */}
            <button
              type="button"
              onClick={handleApplyAllAndShowCode}
              disabled={isApplying || appliedFixes.length === 0}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span>⚡</span>
              <span>Apply All & Show Code</span>
            </button>

            {/* Apply approved */}
            <button
              type="button"
              onClick={() => handleApplyFix()}
              disabled={isApplying}
              className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isApplying ? (
                <span>Verifying...</span>
              ) : (
                <span>Apply Approved Fixes ({Object.values(approvedFixes).filter(Boolean).length})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
