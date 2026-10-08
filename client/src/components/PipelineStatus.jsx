import React, { useState } from 'react';

/**
 * 6-Stage Autonomous Accessibility Repair Pipeline Stepper
 * Matches the exact design specification:
 * 1. Scan: axe-core & Playwright
 * 2. Localize: CSS selector & AST data-loc
 * 3. Fix: Scoped Babel AST
 * 4. Verify: Re-scan & rollback
 * 5. Certify: JSON & PDF proof
 * 6. Review: Human judgment queue
 */
export default function PipelineStatus({
  activeStep = 'fix', // 'scan' | 'localize' | 'fix' | 'verify' | 'certify' | 'review'
  onSelectStep = null,
  className = ''
}) {
  const [selectedInfoStep, setSelectedInfoStep] = useState(null);

  const steps = [
    {
      id: 'scan',
      number: 1,
      title: 'Scan',
      shortDesc: 'axe-core & Play...',
      fullDesc: 'Automated headless Chromium browser scans live DOM against WCAG 2.1 AA rules using axe-core.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      id: 'localize',
      number: 2,
      title: 'Localize',
      shortDesc: 'CSS selector & A...',
      fullDesc: 'Maps browser CSS DOM selectors directly to Babel AST source code files and data-loc AST positions.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      )
    },
    {
      id: 'fix',
      number: 3,
      title: 'Fix',
      shortDesc: 'Scoped Babel A...',
      fullDesc: 'Transforms React JSX AST nodes deterministically (contrast math, alt attributes, labels) without executing code.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      )
    },
    {
      id: 'verify',
      number: 4,
      title: 'Verify',
      shortDesc: 'Re-scan & rollba...',
      fullDesc: 'Immediately re-scans the updated page to witness resolution. Automatically rolls back if regressions occur.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <polyline points="9 12 11 14 15 10"></polyline>
        </svg>
      )
    },
    {
      id: 'certify',
      number: 5,
      title: 'Certify',
      shortDesc: 'JSON & PDF pro...',
      fullDesc: 'Generates immutable cryptographic SHA-256 proof certificates with before/after diffs and rule receipts.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="9 12 11 14 15 10"></polyline>
        </svg>
      )
    },
    {
      id: 'review',
      number: 6,
      title: 'Review',
      shortDesc: 'Human judgment...',
      fullDesc: 'Sends subjective decisions (such as contextual alt text descriptions) to the Human Review Queue for approval.',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      )
    }
  ];

  const getStepStatus = (stepId, index) => {
    const stepOrder = ['scan', 'localize', 'fix', 'verify', 'certify', 'review'];
    const activeIndex = stepOrder.indexOf(activeStep);
    
    if (stepId === activeStep) {
      return 'active'; // Current step (purple highlight like Fix in screenshot)
    }
    if (index < activeIndex) {
      return 'completed'; // Completed steps (green highlight like Scan & Localize in screenshot)
    }
    return 'pending'; // Upcoming steps (subtle gray like Verify, Certify, Review in screenshot)
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm ${className}`}>
      {/* Title */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          PIPELINE STATUS
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline-block">
          Autonomous Repair Architecture
        </span>
      </div>

      {/* Stepper container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center justify-between min-w-[620px] gap-2 px-1">
          {steps.map((step, idx) => {
            const status = getStepStatus(step.id, idx);
            const isLast = idx === steps.length - 1;

            // Box styling matching the user's screenshot
            let boxClasses = '';
            let titleClasses = '';
            let iconClasses = '';

            if (status === 'completed') {
              // Soft green rounded box with thin green border
              boxClasses = 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400';
              titleClasses = 'text-emerald-700 dark:text-emerald-300 font-bold';
              iconClasses = 'text-emerald-600 dark:text-emerald-400';
            } else if (status === 'active') {
              // Soft purple/indigo box with purple border & subtle glow ring
              boxClasses = 'bg-purple-50/80 dark:bg-purple-950/40 border-2 border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-300 shadow-sm shadow-purple-500/20';
              titleClasses = 'text-purple-700 dark:text-purple-300 font-extrabold';
              iconClasses = 'text-purple-600 dark:text-purple-300';
            } else {
              // Pending: subtle light gray/slate
              boxClasses = 'bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-slate-400 dark:text-slate-500';
              titleClasses = 'text-slate-500 dark:text-slate-400 font-medium';
              iconClasses = 'text-slate-400 dark:text-slate-500';
            }

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInfoStep(step);
                    if (onSelectStep) onSelectStep(step.id);
                  }}
                  className="flex flex-col items-center text-center group cursor-pointer focus:outline-none transition-transform hover:-translate-y-0.5"
                  title={`${step.title}: ${step.fullDesc}`}
                >
                  {/* Rounded icon box */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${boxClasses}`}>
                    <div className={iconClasses}>
                      {step.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <span className={`text-xs mt-2 transition-colors ${titleClasses}`}>
                    {step.title}
                  </span>

                  {/* Truncated subtitle */}
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[85px] truncate">
                    {step.shortDesc}
                  </span>
                </button>

                {/* Connecting arrow */}
                {!isLast && (
                  <div className="flex-1 flex items-center justify-center min-w-[20px] max-w-[40px] select-none">
                    <span className={`text-base font-bold ${
                      status === 'completed'
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}>
                      →
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Optional Step Details modal / expander */}
      {selectedInfoStep && (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div>
            <span className="font-bold text-slate-900 dark:text-white">
              Stage {selectedInfoStep.number}: {selectedInfoStep.title}
            </span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">
              — {selectedInfoStep.fullDesc}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedInfoStep(null)}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
