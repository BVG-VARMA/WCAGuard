import React from 'react';

export default function StatusBadge({ status = 'CERTIFIED', size = 'md' }) {
  const isSm = size === 'sm';

  if (status === 'CERTIFIED' || status === 'Certified candidate' || status === 'Certified') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 ${isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 select-none">✓</span>
        <span>CERTIFIED</span>
      </span>
    );
  }

  if (status === 'NEEDS_REVIEW' || status === 'Needs review') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 ${isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
        <span className="font-extrabold text-amber-600 dark:text-amber-400 select-none">●</span>
        <span>NEEDS REVIEW</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 ${isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
      <span className="font-extrabold text-slate-500 select-none">✕</span>
      <span>UNFIXABLE</span>
    </span>
  );
}
