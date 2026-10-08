import React from 'react';

const COVERAGE_DATA = [
  {
    criterion: '1.1.1 Non-text Content',
    level: 'A',
    type: 'Heuristic + Confirmation',
    statusBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    description: 'Auto-detects missing alt text; generates decorative alt="" or context-aware descriptions for human review.',
    machineFixed: false,
    needsReview: true
  },
  {
    criterion: '1.3.1 Info and Relationships',
    level: 'A',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Auto-associates form controls with labels/aria-label, restores semantic landmark tags (<main>, <nav>).',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '1.4.3 Contrast (Minimum)',
    level: 'AA',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Deterministic luminance mathematics. Adjusts lightness in AST styles to guarantee >= 4.5:1 ratio.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '2.4.2 Page Titled',
    level: 'A',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Inserts descriptive <title> tag into HTML head if missing.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '2.4.3 Focus Order',
    level: 'A',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Eliminates disruptive positive tabIndex values and restores natural DOM order.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '2.4.4 Link Purpose (In Context)',
    level: 'A',
    type: 'Heuristic + Confirmation',
    statusBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    description: 'Detects ambiguous generic link text (e.g. "click here") and generates descriptive aria-label.',
    machineFixed: false,
    needsReview: true
  },
  {
    criterion: '2.4.7 Focus Visible',
    level: 'AA',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Detects outline-none without replacement and injects accessible focus rings.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '2.5.8 Target Size (Minimum)',
    level: 'AA (WCAG 2.2)',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Guarantees interactive elements measure at least 24x24 CSS pixels.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '3.1.1 Language of Page',
    level: 'A',
    type: 'Certified Fixed',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Injects valid lang="en" on root <html> tag.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '4.1.2 Name, Role, Value',
    level: 'A',
    type: 'Certified Fixed / Review',
    statusBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    description: 'Removes invalid ARIA roles and misspelled attributes; infers missing button names.',
    machineFixed: true,
    needsReview: false
  },
  {
    criterion: '1.2.2 Captions (Prerecorded)',
    level: 'A',
    type: 'Detection Only',
    statusBadge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    description: 'Detects video/audio elements lacking track captions. Media transcriptions require human authoring.',
    machineFixed: false,
    needsReview: false
  },
  {
    criterion: '2.3.1 Three Flashes or Below Threshold',
    level: 'A',
    type: 'Detection Only',
    statusBadge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    description: 'Flags rapid flashing elements. Animation overhaul requires UI design sign-off.',
    machineFixed: false,
    needsReview: false
  }
];

export default function WcagCoverageTable() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          WCAG 2.1 & 2.2 Remediation Scope & Classification
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Honest classification of criteria into certified machine-checkable fixes, heuristic human-in-the-loop fixes, and detection-only scopes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="p-3">Criterion & Level</th>
              <th scope="col" className="p-3">Remediation Classification</th>
              <th scope="col" className="p-3">Engine Behavior</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {COVERAGE_DATA.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                  <div>{row.criterion}</div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-normal">
                    Level {row.level}
                  </span>
                </td>

                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold ${row.statusBadge}`}>
                    <span className="font-bold select-none">
                      {row.machineFixed ? '✓' : row.needsReview ? '●' : '👁'}
                    </span>
                    <span>{row.type}</span>
                  </span>
                </td>

                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
