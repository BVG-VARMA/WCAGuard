import React from 'react';
import Flowchart from '../components/Flowchart.jsx';

export default function Landing({ onNavigateToScan, onNavigateToCode, onNavigateToDeck }) {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B192C] via-[#1E3A8A] to-[#0F172A] text-white p-8 sm:p-14 lg:p-16 border border-blue-900/60 shadow-2xl">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Automated WCAG 2.1 & 2.2 AA Remediation Engine
          </div>

          {/* Project Title & Tagline */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            WCAGuard
          </h1>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-wide">
            “Find it. Fix it. Prove it.”
          </p>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            An automated accessibility repair engine that finds WCAG issues, safely repairs selected code problems, verifies every change, and creates proof.
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onNavigateToScan}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>Scan a Website URL</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToCode}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <span>Analyze React Code (JSX)</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToDeck}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl text-sm font-semibold text-blue-200 hover:text-white hover:bg-white/10 transition-all border border-blue-400/20 flex items-center justify-center gap-1.5"
            >
              <span>Presentation Pitch Deck</span>
            </button>
          </div>

          {/* Core Honesty Disclaimer Callout */}
          <div className="pt-6">
            <div className="p-4 rounded-xl bg-slate-900/70 border border-amber-400/30 text-xs text-amber-200/90 max-w-2xl mx-auto flex items-start gap-3 text-left">
              <span className="text-amber-400 text-base font-bold select-none">⚠️</span>
              <div>
                <span className="font-bold text-amber-300 block mb-0.5">Honest Conformance Commitment:</span>
                “WCAGuard certifies specific machine-checkable repairs. It does not claim full or 100% WCAG conformance.”
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            How WCAGuard Works
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic AST remediation with automated post-repair verification
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mb-4">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Scan
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Detect accessibility barriers via Playwright headless Chromium & axe-core rules across WCAG 2.1 & 2.2 standards.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold mb-4">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Repair
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apply safe, deterministic source-code AST fixes for form labels, button names, page language, luminance contrast, and targets.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold mb-4">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Verify
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Re-scan every repair. If any fix fails or introduces regression defects, automatically roll back source code instantly.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold mb-4">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Prove
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Issue individual cryptographic verification certificates and comprehensive downloadable PDF & JSON audit reports.
            </p>
          </div>
        </div>
      </section>

      {/* Target User Experience Showcase */}
      <section className="bg-slate-100 dark:bg-slate-800/60 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-700">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Tailored Experiences
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Built for Visitors & Developers Alike
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal User Experience */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                A
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Website Visitors & Auditors
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Paste any public website URL to receive a clean, visual score with plain-English accessibility explanations:
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                “Text may be too small or difficult to read.”
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                “This video may need captions for deaf or hard-of-hearing users.”
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                “This button may be difficult to use with a keyboard.”
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span>
                “This image may need a description for screen readers.”
              </li>
            </ul>
          </div>

          {/* Developer Experience */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                B
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                React Web Developers
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Paste React JSX source code or audit local development servers (`http://localhost:5173`):
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                Detailed WCAG criterion breakdown & exact DOM element locators.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                Side-by-side before/after code diff viewer powered by react-diff-viewer.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                One-click safe AST code repair with automatic rollback protection.
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span>
                Cryptographic proof certificates and exportable PDF audit summaries.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Interactive Flowchart */}
      <section>
        <Flowchart />
      </section>
    </div>
  );
}
