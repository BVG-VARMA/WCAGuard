import React, { useState } from 'react';

export default function Home({
  targetUrl,
  setTargetUrl,
  onScan,
  onUpload,
  loading,
  statusMessage
}) {
  const [uploadedName, setUploadedName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedName(file.name);
    await onUpload(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold mb-2">
              <span className="text-emerald-500 font-bold">🛡️</span>
              <span>WCAG 2.1 & 2.2 AA Compliance Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              WCAGuard Remediation Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Find accessibility violations in React web apps, auto-fix AST source nodes, re-verify with Playwright, and issue cryptographic certificates.
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label htmlFor="url-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Application URL
            </label>
            <input
              id="url-input"
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="http://localhost:5173 or https://your-site.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => onScan(targetUrl)}
              disabled={loading || !targetUrl}
              className="w-full h-11 px-6 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Scanning...</span>
              ) : (
                <>
                  <span>▶</span>
                  <span>Scan Target</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Upload Zip Option & Note */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
              <span>📁</span>
              <span>Upload React Project Zip</span>
              <input type="file" accept=".zip" onChange={handleFileChange} className="hidden" />
            </label>
            {uploadedName && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {uploadedName} staged
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            "Only scan sites you own or have explicit permission to test."
          </p>
        </div>

        {/* Loading Progress */}
        {loading && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200">
            <span className="animate-spin text-blue-600 font-bold">⚙</span>
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
