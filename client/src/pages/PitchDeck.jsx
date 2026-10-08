import React, { useState, useEffect } from 'react';
import Flowchart from '../components/Flowchart.jsx';

export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [copied, setCopied] = useState(false);

  // Keyboard navigation for presentation slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(7, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(1, prev - 1));
      } else if (e.key >= '1' && e.key <= '7') {
        setCurrentSlide(parseInt(e.key, 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slideTitles = [
    'Title & Mission',
    'Problem Statement',
    'Solution & Pipeline',
    'System Architecture',
    'Technology Stack',
    'Implementation Plan',
    'Impact & Conclusion'
  ];

  const handleCopySlideContent = () => {
    const slideText = getSlideMarkdown(currentSlide);
    navigator.clipboard.writeText(slideText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-6">
      {/* Presentation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {currentSlide}/7
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">
              Slide {currentSlide}: {slideTitles[currentSlide - 1]}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Interactive 7-Slide Pitch Deck • Use Arrow Keys or Numbers 1-7
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopySlideContent}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            title="Copy slide content to paste into PowerPoint or notes"
          >
            <span>📋</span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Slide Text'}</span>
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
              disabled={currentSlide === 1}
              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Previous Slide"
            >
              ← Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((prev) => Math.min(7, prev + 1))}
              disabled={currentSlide === 7}
              className="px-3 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Next Slide"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Indicator Pills */}
      <div className="flex justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => setCurrentSlide(num)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              currentSlide === num
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {num}. {slideTitles[num - 1].split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Slide Presentation Canvas */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-12 border border-slate-800 shadow-2xl min-h-[580px] flex flex-col justify-between relative overflow-hidden">
        {/* SLIDE 1: TITLE */}
        {currentSlide === 1 && (
          <div className="space-y-8 my-auto text-center py-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <span>🛡️</span>
              <span>Automated Accessibility Repair Engine</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-5xl sm:text-7xl font-black tracking-tight text-white">
                WCAGuard
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-wide">
                “Find it. Fix it. Prove it.”
              </p>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
                Automated accessibility scanner & repair engine that audits websites with Chromium & axe-core, safely rewrites React source-code via Babel AST, re-scans every change, and issues verifiable proof certificates.
              </p>
            </div>

            {/* Visual: A shield/checkmark with: Scan -> Fix -> Verify -> Prove */}
            <div className="pt-6 max-w-xl mx-auto">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-inner space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 text-white text-3xl font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  ✓
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-4 font-bold text-xs sm:text-sm text-slate-200">
                  <span className="px-3 py-1.5 rounded-lg bg-blue-900/60 border border-blue-500/40 text-blue-200">Scan</span>
                  <span className="text-emerald-400">→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-500/40 text-emerald-200">Fix</span>
                  <span className="text-emerald-400">→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-900/60 border border-amber-500/40 text-amber-200">Verify</span>
                  <span className="text-emerald-400">→</span>
                  <span className="px-3 py-1.5 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-200">Prove</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: PROBLEM STATEMENT */}
        {currentSlide === 2 && (
          <div className="space-y-6 my-auto">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Slide 2 • Problem Statement</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Web Accessibility is Broken at Scale
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Bullet points */}
              <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-red-400 text-base font-bold select-none">•</span>
                  <span><strong>Over 1 billion people</strong> live with disabilities globally, yet 96%+ of top 1M homepages fail basic WCAG checks.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-red-400 text-base font-bold select-none">•</span>
                  <span><strong>Current tools only detect:</strong> Traditional scanners dump 200+ warnings on developers and leave manual rework.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-red-400 text-base font-bold select-none">•</span>
                  <span><strong>Escalating Legal Liability:</strong> Massive enforcement under the ADA (US), European Accessibility Act (EAA), and India’s RPwD Act.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="text-red-400 text-base font-bold select-none">•</span>
                  <span><strong>The False Promise of "100% Auto-Fix":</strong> Overlays claim magic fixes and fail. Meaning-based issues require human judgment. Realistic solutions must certify machine-checkable repairs and escalate semantic decisions to humans.</span>
                </div>
              </div>

              {/* Visual: Problems detected vs Problems repaired comparison */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider text-center">
                  Industry Reality: Detection vs. Remediation
                </h3>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-red-400">Problems Detected by Conventional Scanners</span>
                      <span className="text-red-400">100%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                      <div className="bg-red-500 h-4 rounded-full w-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-400">Problems Actually Repaired by Tools</span>
                      <span className="text-slate-400">0% (Manual Burden)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                      <div className="bg-slate-600 h-4 rounded-full w-[4%]"></div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-400">WCAGuard Machine-Checkable Certified Repairs</span>
                      <span className="text-emerald-400">Verified & Re-Scanned</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                      <div className="bg-emerald-500 h-4 rounded-full w-[68%]"></div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center italic pt-2">
                  "Most tools detect and abandon. WCAGuard fixes, re-scans, and creates proof."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: SOLUTION */}
        {currentSlide === 3 && (
          <div className="space-y-6 my-auto">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Slide 3 • The Solution</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Find it. Fix it. Prove it.
              </h2>
            </div>

            {/* 6-step horizontal pipeline */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
                The 6-Step Autonomous Repair Pipeline
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-500 text-blue-200">1. Scan</div>
                <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-500 text-indigo-200">2. Localize</div>
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200">3. Fix</div>
                <div className="p-2.5 rounded-xl bg-amber-950 border border-amber-500 text-amber-200">4. Verify</div>
                <div className="p-2.5 rounded-xl bg-purple-950 border border-purple-500 text-purple-200">5. Certify</div>
                <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-600 text-slate-200">6. Review</div>
              </div>
            </div>

            {/* Key features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Playwright + Chromium + axe-core scanning
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Babel AST React JSX source-code safe transformations
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Re-scan proof witness verification after every repair
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Automatic instant rollback for any unsafe or regressive edits
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Cryptographic certificates with rule, diff, and witness proof
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Human review queue for semantic values (alt text)
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Before/after score calculation with Chart.js
                </div>
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="text-emerald-400">✓</span> Downloadable JSON & PDF audit reports (pdfkit)
                </div>
              </div>
            </div>

            {/* 3 Statuses */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                <span className="text-xs font-black text-emerald-300 block">1. Certified</span>
                <span className="text-[11px] text-slate-400">Safe fix applied & passed re-scan witness</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-center">
                <span className="text-xs font-black text-amber-300 block">2. Needs Review</span>
                <span className="text-[11px] text-slate-400">Requires human judgment (e.g. image alt)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-center">
                <span className="text-xs font-black text-slate-300 block">3. Unfixable</span>
                <span className="text-[11px] text-slate-400">Cannot safely be resolved automatically</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: ARCHITECTURE */}
        {currentSlide === 4 && (
          <div className="space-y-6 my-auto">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Slide 4 • Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Engine Architecture & Secure Data Flow
              </h2>
            </div>

            {/* ASCII Architecture diagram */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
{`┌────────────────────────────────────────────────────────────────────────┐
│ REACT FRONTEND DASHBOARD (Vite + Tailwind + Chart.js + react-diff)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API (JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│ EXPRESS REPAIR ENGINE (Node.js)                                        │
│  ├── Security (SSRF Guard, Environment Validator, Rate Limiter)        │
│  ├── Scanner (Playwright + Chromium + axe-core runtime engine)         │
│  ├── Localizer (DOM selector mapping & data-loc coordinates)           │
│  ├── Classifier (Certified candidate / Needs review / Unfixable)       │
│  ├── Fixer (Babel AST Parser, Traverse & Generator rewrite rules)      │
│  ├── Verifier (Re-scans post-state; triggers automatic rollback)       │
│  └── Storage & Reports (JSON file persistence & pdfkit generator)      │
└────────────────────────────────────────────────────────────────────────┘`}
            </div>

            {/* Security specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white block mb-1">🛡️ SSRF & URL Guard</span>
                <span className="text-slate-400 text-[11px]">Blocks loopbacks, private IPs & metadata endpoints in Public mode. Strict localhost isolation.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white block mb-1">🔒 AST Sandbox</span>
                <span className="text-slate-400 text-[11px]">Uploaded & pasted React JSX is parsed statically into AST nodes. Zero code execution in VMs.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="font-bold text-white block mb-1">🗑️ Ephemeral Storage</span>
                <span className="text-slate-400 text-[11px]">Temporary files purged automatically post-report. Pure JSON storage with zero database footprint.</span>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: TECHNOLOGY STACK */}
        {currentSlide === 5 && (
          <div className="space-y-4 my-auto">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Slide 5 • Technology Stack</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Lean, High-Performance Technology Stack
              </h2>
            </div>

            {/* Exactly Specified Tech Stack Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-900 uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Layer</th>
                    <th className="p-2.5">Technology</th>
                    <th className="p-2.5">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                  <tr>
                    <td className="p-2.5 text-blue-400 font-bold">Frontend</td>
                    <td className="p-2.5 text-white">React + Vite</td>
                    <td className="p-2.5 text-slate-300">Builds the interactive dashboard</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-blue-400 font-bold">Styling</td>
                    <td className="p-2.5 text-white">Tailwind CSS</td>
                    <td className="p-2.5 text-slate-300">Creates responsive, consistent UI quickly</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-blue-400 font-bold">Visualization</td>
                    <td className="p-2.5 text-white">Chart.js</td>
                    <td className="p-2.5 text-slate-300">Shows before/after scores and issue charts</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-blue-400 font-bold">Code comparison</td>
                    <td className="p-2.5 text-white">react-diff-viewer</td>
                    <td className="p-2.5 text-slate-300">Displays code repair changes side by side</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-emerald-400 font-bold">Backend</td>
                    <td className="p-2.5 text-white">Node.js + Express</td>
                    <td className="p-2.5 text-slate-300">Provides scan, fix, verify, and report APIs</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-emerald-400 font-bold">Scanning</td>
                    <td className="p-2.5 text-white">Playwright + axe-core</td>
                    <td className="p-2.5 text-slate-300">Opens websites and finds WCAG violations</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-emerald-400 font-bold">Code repair</td>
                    <td className="p-2.5 text-white">Babel parser, traverse, generator, types</td>
                    <td className="p-2.5 text-slate-300">Safely reads and rewrites React JSX source</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-amber-400 font-bold">Optional AI</td>
                    <td className="p-2.5 text-white">LLM API</td>
                    <td className="p-2.5 text-slate-300">Suggests alt text; always marked Needs review</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-400 font-bold">Storage</td>
                    <td className="p-2.5 text-white">JSON files</td>
                    <td className="p-2.5 text-slate-300">Stores scans, certificates, and reports</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-purple-400 font-bold">Reports</td>
                    <td className="p-2.5 text-white">pdfkit</td>
                    <td className="p-2.5 text-slate-300">Generates downloadable PDF reports</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-red-400 font-bold">Security</td>
                    <td className="p-2.5 text-white">dotenv, express-rate-limit, URL validation</td>
                    <td className="p-2.5 text-slate-300">Protects secrets, prevents abuse, validates URLs</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-400 font-bold">Demo</td>
                    <td className="p-2.5 text-white">Deliberately broken React app</td>
                    <td className="p-2.5 text-slate-300">Demonstrates detection and repair live</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE 6: IMPLEMENTATION PLAN */}
        {currentSlide === 6 && (
          <div className="space-y-4 my-auto">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Slide 6 • Execution Plan</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                24-Hour Hackathon Implementation Timeline
              </h2>
            </div>

            {/* 24-hour timeline table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono text-slate-300">
                <thead className="bg-slate-900 uppercase font-bold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 w-24">Hours</th>
                    <th className="p-2.5">Milestone & Work Deliverables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">0–3</td>
                    <td className="p-2.5 text-slate-200">Project setup, scanner, Express API, React dashboard shell</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">3–9</td>
                    <td className="p-2.5 text-slate-200">Babel auto-fix rules for labels, button names, lang, contrast, target size</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">9–13</td>
                    <td className="p-2.5 text-slate-200">Verifier, re-scan logic, rollback, certificate JSON</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">13–18</td>
                    <td className="p-2.5 text-slate-200">Dashboard, charts, code diff, issue statuses</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">18–21</td>
                    <td className="p-2.5 text-slate-200">Broken demo application, testing, PDF reports</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-400">21–24</td>
                    <td className="p-2.5 text-slate-200">Polish, README, demo video, pitch practice, final tests</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Team Roles & Risks / Mitigations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Team Allocation:</span>
                <p className="text-slate-400 text-[11px]">Member 1: Frontend dashboard • Member 2: Scanner & Express • Member 3: Babel rules & Verifier • Member 4: Demo app, testing, PDF report & pitch.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Key Risks & Mitigations:</span>
                <p className="text-slate-400 text-[11px]">Source mapping ambiguity → data-loc AST coordinates. Unsafe automatic changes → scoped deterministic transformations + instant rollback. Ambiguous alt text → human review queue.</p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: IMPACT AND CONCLUSION */}
        {currentSlide === 7 && (
          <div className="space-y-6 my-auto text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
              <span>🌍</span>
              <span>Global Accessibility Impact</span>
            </div>

            <div className="space-y-2 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Moving from “Issue Found” to “Verified Repair Applied”
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed pt-2">
                Accessibility is a human right. WCAGuard empowers developers to bridge the gap between compliance mandates and tangible digital inclusion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-extrabold text-xs block">Inclusive Access</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Websites become usable for people with visual, auditory, cognitive, and motor impairments, older adults, and mobile users.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-blue-400 font-extrabold text-xs block">Engineering Velocity</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Eliminates weeks of repetitive remediation tasks through deterministic AST rewrites with verified witness proof.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-amber-400 font-extrabold text-xs block">Honest Governance</span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Replaces dishonest 100% overlay badges with verified machine-checkable certificates and human editorial review.
                </p>
              </div>
            </div>

            {/* Mandatory final line */}
            <div className="pt-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-emerald-950/60 border border-emerald-500/40 shadow-lg">
                <p className="text-sm sm:text-base font-extrabold text-emerald-300 italic">
                  “WCAGuard does not promise impossible perfection. It makes provable progress toward a more inclusive web.”
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Slide Footer */}
        <div className="pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>WCAGuard Pitch Deck • Presentation Mode</span>
          <span className="font-mono">Slide {currentSlide} of 7</span>
        </div>
      </div>

      {/* Embedded Architectural Flowchart for Judge Review */}
      <div className="mt-8">
        <div className="mb-3 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Full Pipeline Specification
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Architecture Flowchart (Embedded)
          </h3>
        </div>
        <Flowchart />
      </div>
    </div>
  );
}

function getSlideMarkdown(slideNumber) {
  const slides = {
    1: `# SLIDE 1 — TITLE
WCAGuard
“Find it. Fix it. Prove it.”
Automated Accessibility Repair Engine

Visual:
A shield/checkmark with:
Scan → Fix → Verify → Prove`,

    2: `# SLIDE 2 — PROBLEM STATEMENT
- Over one billion people live with disabilities.
- Many websites fail basic accessibility checks.
- Current accessibility tools mainly detect problems and leave developers to manually repair them.
- Poor accessibility excludes people and causes lost users, legal risk, and costly rework.
- Legal pressure includes:
  - ADA
  - EU Accessibility Act
  - India’s RPwD Act
- Fully automatic repair of every WCAG rule is impossible because some issues require human judgment and real runtime context.
- A realistic solution must certify machine-checkable repairs and send judgment-based problems to humans.

Suggested visual:
A comparison chart:
“Problems detected” versus “Problems actually repaired.”`,

    3: `# SLIDE 3 — SOLUTION
Pipeline:
Scan → Localize → Fix → Verify → Certify → Review

Features:
- Playwright + axe-core scanning.
- Babel AST React source-code repairs.
- Re-scan proof after every repair.
- Automatic rollback for unsafe changes.
- Certificates with rule, before code, after code, and verification proof.
- Human review queue.
- Before/after accessibility score.
- JSON/PDF report download.

Three statuses:
- Certified
- Needs review
- Unfixable

Main difference:
“Most tools detect. WCAGuard fixes and proves.”

Suggested visual:
Six-step horizontal pipeline diagram.`,

    4: `# SLIDE 4 — ARCHITECTURE
Layers:
- React dashboard.
- Node.js/Express repair engine:
  - Scanner
  - Localizer
  - Fixer
  - Verifier
  - Certificate generator
- Tools:
  - Playwright + axe-core
  - Babel AST
  - Optional LLM suggestions
  - JSON files

Data flow:
Input URL or React code → Validate → Scan → Classify → Auto-fix or Human review → Verify → Certificates and report

Security:
- SSRF protection.
- URL validation.
- Sandboxed browser.
- No execution of uploaded code.
- Delete-after-scan privacy.

Suggested visual:
Architecture diagram.`,

    5: `# SLIDE 5 — TECHNOLOGY STACK

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Builds the interactive dashboard |
| Styling | Tailwind CSS | Creates responsive, consistent UI quickly |
| Visualization | Chart.js | Shows before/after scores and issue charts |
| Code comparison | react-diff-viewer | Displays code repair changes side by side |
| Backend | Node.js + Express | Provides scan, fix, verify, and report APIs |
| Scanning | Playwright + axe-core | Opens websites and finds WCAG violations |
| Code repair | Babel parser, traverse, generator, types | Safely reads and rewrites React JSX source |
| Optional AI | LLM API | Suggests alt text; always marked Needs review |
| Storage | JSON files | Stores scans, certificates, and reports |
| Reports | pdfkit | Generates downloadable PDF reports |
| Security | dotenv, express-rate-limit, URL validation | Protects secrets, prevents abuse, validates URLs |
| Demo | Deliberately broken React app | Demonstrates detection and repair live |`,

    6: `# SLIDE 6 — IMPLEMENTATION PLAN

| Hours | Work |
|---|---|
| 0–3 | Project setup, scanner, Express API, React dashboard shell |
| 3–9 | Babel auto-fix rules for labels, button names, lang, contrast, target size |
| 9–13 | Verifier, re-scan logic, rollback, certificate JSON |
| 13–18 | Dashboard, charts, code diff, issue statuses |
| 18–21 | Broken demo application, testing, PDF reports |
| 21–24 | Polish, README, demo video, pitch practice, final tests |

Milestones:
- Scanner works.
- One full certified repair works.
- Verification and rollback work.
- Dashboard demonstrates proof.
- Demo is ready.

Team roles:
- Member 1: Frontend dashboard.
- Member 2: Scanner and Express backend.
- Member 3: Babel repair rules and verifier.
- Member 4: Demo app, testing, report, pitch.

Risks and mitigation:
- Source mapping difficulty → add data-loc markers to demo JSX.
- Unsafe automatic changes → use only scoped deterministic repairs and rollback.
- Meaningful alt text requires judgment → human review queue.
- Time shortage → prioritize scanner, three safe fixes, verification, score, and reports.

Minimum viable product:
- URL/code scan.
- Detect violations.
- Auto-fix lang, labels, and button names.
- Re-scan verification.
- Before/after score.
- JSON/PDF report.`,

    7: `# SLIDE 7 — IMPACT AND CONCLUSION
- Helps make websites easier to use for people with disabilities, older adults, children, mobile users, and anyone in difficult conditions.
- Helps developers move from “issue found” to “verified repair applied.”
- Uses honest limits: automation for safe fixes and human judgment where required.

Final line:
“WCAGuard does not promise impossible perfection. It makes provable progress toward a more inclusive web.”`
  };

  return slides[slideNumber] || '';
}
