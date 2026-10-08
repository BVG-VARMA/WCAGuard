import React from 'react';

export default function Flowchart({ activeStep = null }) {
  const steps = [
    { id: 'input', label: '1. User Input', desc: 'URL or React JSX source' },
    { id: 'validate', label: '2. Validation & Security', desc: 'SSRF check & environment mode' },
    { id: 'scan', label: '3. Scan Engine', desc: 'Playwright + axe-core / Babel AST' },
    { id: 'classify', label: '4. Localize & Classify', desc: 'Candidate, Needs review, or Unfixable' },
    { id: 'fix', label: '5. Babel AST Fixer', desc: 'Safe deterministic rewrite rules' },
    { id: 'verify', label: '6. Re-scan Verifier', desc: 'Confirm fix & rollback regressions' },
    { id: 'certify', label: '7. Certify & Report', desc: 'Tamper-evident JSON & PDF proof' }
  ];

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Pipeline Architecture
          </span>
          <h3 className="text-xl font-extrabold text-white">
            Find it. Fix it. Prove it.
          </h3>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-blue-900/60 text-blue-300 border border-blue-500/30 font-semibold">
          Automated Verification & Rollback
        </span>
      </div>

      {/* Horizontal Steps on desktop, vertical on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 relative">
        {steps.map((step, idx) => {
          const isActive = activeStep === step.id;
          return (
            <div
              key={step.id}
              className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-blue-900/40 border-emerald-400 ring-2 ring-emerald-400/30'
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
                    {idx + 1}
                  </span>
                  {idx < steps.length - 1 && (
                    <span className="hidden md:inline text-slate-500 font-bold text-xs">→</span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-100 leading-tight">
                  {step.label}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* ASCII Architectural Flow Diagram */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">Decision Logic Tree</span>
          <span className="text-[10px] text-slate-500 font-mono">Rollback Guarantee</span>
        </div>
        <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] leading-relaxed text-emerald-400/90 overflow-x-auto border border-slate-800">
{`┌─────────────────────────────────┐
│     User enters URL or JSX      │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Validate URL / Code (SSRF)     │
│  Public or Local Dev mode       │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Scan: Playwright + axe-core    │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│  Localize and Classify          │
└───────┬─────────────────┬───────┘
        │                 │
        ▼                 ▼
┌───────────────┐  ┌──────────────────────┐
│ Safe repair?  │  │ Needs review or      │
└───────┬───────┘  │ Unfixable (human)    │
        │ Yes      └──────────┬───────────┘
        ▼                     │
┌───────────────────────┐     │
│ Babel AST Auto-Fix    │     │
└───────┬───────────────┘     │
        │                     │
        ▼                     │
┌───────────────────────┐     │
│ Verify by Re-scanning │     │
└───────┬───────┬───────┘     │
        │ Pass  │ Fail        │
        ▼       ▼             │
┌──────────────┐ ┌──────────┐ │
│ Certified    │ │ Rollback │ │
│ Certificate  │ │ Safely   │ │
└───────┬──────┘ └────┬─────┘ │
        └───────┬─────┴───────┘
                ▼
┌─────────────────────────────────┐
│ Dashboard, Score, Certificates, │
│ JSON Audit & PDF Downloads      │
└─────────────────────────────────┘`}
        </pre>
      </div>
    </div>
  );
}
