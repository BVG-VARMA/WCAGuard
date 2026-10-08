import React, { useState } from 'react';

const IMPACT_COLORS = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-300 dark:border-red-800',
  serious: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  minor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800'
};

const IMPACT_SYMBOLS = {
  critical: '🔴',
  serious: '🟠',
  moderate: '🟡',
  minor: '🔵'
};

export default function ViolationCard({
  violation,
  isSelected,
  onToggle
}) {
  const [expanded, setExpanded] = useState(false);
  const firstNode = violation.nodes?.[0];
  const loc = firstNode?.dataLoc || 'App.jsx:line';

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs hover:border-blue-400 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            aria-label={`Select ${violation.id} for auto-fix`}
            className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{violation.id}</span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${IMPACT_COLORS[violation.impact] || IMPACT_COLORS.minor}`}>
                <span className="text-[10px] select-none">{IMPACT_SYMBOLS[violation.impact] || '●'}</span>
                <span className="capitalize">{violation.impact}</span>
              </span>
            </div>

            <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mt-0.5">
              {violation.wcagCriterion}
            </p>

            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 mt-2">
              <span className="text-slate-500 select-none">📍</span>
              <span>{loc}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white font-mono text-xs"
          aria-expanded={expanded}
          aria-label={`Toggle details for ${violation.id}`}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <p>{violation.description}</p>
          {firstNode?.html && (
            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                <span>&lt;/&gt;</span>
                <span>HTML Element:</span>
              </div>
              <pre className="p-2.5 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
                <code>{firstNode.html}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
