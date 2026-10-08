import React, { useState, useEffect } from 'react';
import { fetchUserScans } from '../api/supabase.js';
import { getScansHistory, getPdfDownloadUrl } from '../api/client.js';
import { useAuth } from '../hooks/useAuth.jsx';

/**
 * Stage 2: History Page
 * Lists past scans and cryptographic certificates for the authenticated user
 */
export default function History({ onNavigateToScan, onSelectReport }) {
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'code' | 'url' | 'certified'

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError('');
      try {
        let records = [];
        if (user?.id) {
          try {
            records = await fetchUserScans(user.id);
          } catch {
            // fallback to server endpoint
            const res = await getScansHistory();
            records = res.scans || [];
          }
        } else {
          const res = await getScansHistory();
          records = res.scans || [];
        }
        setScans(records);
      } catch (err) {
        setError(err.message || 'Failed to load past scans.');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  const filteredScans = scans.filter((s) => {
    if (filter === 'code') return s.input_type === 'code' || s.mode === 'code' || (!s.target_url && !s.url?.startsWith('http'));
    if (filter === 'url') return s.input_type === 'url' || s.mode === 'url' || s.target_url || s.url?.startsWith('http');
    if (filter === 'certified') {
      const certs = s.certificates || [];
      return certs.length > 0 || s.counts?.certified > 0;
    }
    return true;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-900/40 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span>📜</span>
            <span>Cryptographic Proof Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Audit & Scan History
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-normal leading-relaxed">
            Review your past WCAG accessibility audits, verifiable SHA-256 certificates, and code remediation snapshots.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onNavigateToScan}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md flex items-center gap-2"
          >
            <span>+ New Scan</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Scans ({scans.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('code')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'code'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          React Code
        </button>
        <button
          type="button"
          onClick={() => setFilter('url')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'url'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          URL Audits
        </button>
        <button
          type="button"
          onClick={() => setFilter('certified')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            filter === 'certified'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Certified Only
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your scan vault...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredScans.length === 0 && (
        <div className="py-16 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl">
            📂
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No audit records found
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You haven't conducted any scans matching this filter yet. Run an automated scan to begin building your verifiable proof log.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={onNavigateToScan}
              className="px-5 py-2.5 rounded-xl bg-[#111] hover:bg-black text-white text-xs font-semibold shadow-sm"
            >
              Start First Audit
            </button>
          </div>
        </div>
      )}

      {/* Scans Grid / List */}
      {!loading && filteredScans.length > 0 && (
        <div className="space-y-4">
          {filteredScans.map((scan) => {
            const isCode = scan.input_type === 'code' || scan.mode === 'code' || (!scan.target_url && !scan.url?.startsWith('http'));
            const title = scan.target_url || scan.url || 'React JSX Source Code';
            const timestamp = scan.created_at || scan.timestamp || new Date().toISOString();
            const certCount = scan.certificates?.length || scan.counts?.certified || 0;
            const issuesCount = scan.scan_issues?.length || scan.violations?.length || scan.violationsCount || scan.counts?.total || 0;
            const score = scan.score || scan.scoreAfter || scan.scoreBefore || 75;

            return (
              <div
                key={scan.id || scan.scanId || Math.random()}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCode
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                      }`}
                    >
                      {isCode ? 'React Code' : 'Live DOM URL'}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {new Date(timestamp).toLocaleString()}
                    </span>

                    {scan.saved_code && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 font-semibold">
                        Code saved
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-xl">
                    {title}
                  </h3>

                  {/* Summary badges */}
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                    <div>
                      Score: <strong className="text-emerald-600 dark:text-emerald-400">{score}/100</strong>
                    </div>
                    <div>
                      Issues: <strong>{issuesCount}</strong>
                    </div>
                    {certCount > 0 && (
                      <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span>🛡️</span>
                        <span>{certCount} Certified Fixes</span>
                      </div>
                    )}
                    {scan.code_hash && (
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                        SHA-256: {scan.code_hash.slice(0, 12)}...
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  {onSelectReport && (
                    <button
                      type="button"
                      onClick={() => onSelectReport(scan)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      View Report
                    </button>
                  )}

                  {(scan.scanId || scan.id) && (
                    <a
                      href={getPdfDownloadUrl(scan.scanId || scan.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>📥</span>
                      <span>PDF</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
