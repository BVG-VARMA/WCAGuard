import React, { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function DiffViewer({ diffs = [], oldCode = '', newCode = '', filename = 'Component.jsx' }) {
  const [splitView, setSplitView] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // If passed an array of diff objects from project scan
  const activeDiff = diffs.length > 0 ? diffs[selectedIdx] : null;
  const original = activeDiff?.original ?? oldCode;
  const modified = activeDiff?.modified ?? newCode;
  const displayFile = activeDiff?.file ?? filename;

  const handleCopy = () => {
    const textToCopy = activeDiff?.patch || modified || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!original && !modified) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        No code changes to display.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Diff Controls Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {diffs.length > 1 ? (
            diffs.map((d, idx) => (
              <button
                key={d.file || idx}
                onClick={() => setSelectedIdx(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedIdx === idx
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {d.file}
              </button>
            ))
          ) : (
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded">
              {displayFile}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Split vs Inline Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSplitView(true)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                splitView ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Side-by-Side
            </button>
            <button
              type="button"
              onClick={() => setSplitView(false)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                !splitView ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Inline
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy Diff'}
          </button>
        </div>
      </div>

      {/* React Diff Viewer Component */}
      <div className="overflow-x-auto text-xs max-h-[500px]">
        <ReactDiffViewer
          oldValue={original || ''}
          newValue={modified || ''}
          splitView={splitView}
          leftTitle="Original Source Code (Pre-Remediation)"
          rightTitle="Certified Remediation (Babel AST Auto-Fix)"
          useDarkTheme={true}
          styles={{
            variables: {
              dark: {
                diffViewerBackground: '#0b1329',
                diffViewerColor: '#e2e8f0',
                addedBackground: 'rgba(13, 148, 136, 0.25)', // Teal for added line
                addedColor: '#2dd4bf',
                removedBackground: 'rgba(239, 68, 68, 0.25)', // Red for removed line
                removedColor: '#fca5a5',
                wordAddedBackground: 'rgba(13, 148, 136, 0.5)', // Teal highlight
                wordRemovedBackground: 'rgba(239, 68, 68, 0.5)', // Red highlight
                addedGutterColor: '#0d9488',
                removedGutterColor: '#ef4444',
                gutterBackground: '#070d1e',
                gutterBackgroundDark: '#040711',
                highlightBackground: '#1e293b',
                highlightGutterBackground: '#0f172a'
              }
            },
            wordAdded: {
              fontWeight: 'bold', // Bold for changed token
              color: '#5eead4'
            },
            wordRemoved: {
              fontWeight: 'bold', // Bold for changed token
              color: '#fca5a5'
            },
            contentText: {
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.6'
            }
          }}
        />
      </div>
    </div>
  );
}
