import React, { useState } from 'react';
import DiffViewer from './DiffViewer.jsx';

const RULE_KNOWLEDGE_BASE = {
  'document-title': {
    name: 'Document Must Have a <title> Element',
    criterion: 'WCAG 2.4.2 Page Titled (Level A)',
    simpleExplanation: 'The web page is missing a browser window title, making it difficult to find when switching tabs or using bookmarks.',
    technicalExplanation: 'The HTML <head> section does not contain a non-empty <title> element, violating document title requirements.',
    whyItMatters: 'Screen reader users and people with multiple tabs open rely on window titles to know which page or task they are viewing.',
    suggestedSolution: 'Add a descriptive <title> tag inside the <head> element explaining the page content.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'html-has-lang': {
    name: '<html> Element Must Have a Valid Lang Attribute',
    criterion: 'WCAG 3.1.1 Language of Page (Level A)',
    simpleExplanation: 'The website does not specify what language it is written in, causing screen readers and speech synthesis software to mispronounce words.',
    technicalExplanation: 'The root <html> element is missing a valid lang attribute (e.g. lang="en").',
    whyItMatters: 'Screen readers need the lang attribute to pronounce text with the correct language accent, cadence, and phonetics.',
    suggestedSolution: 'Add lang="en" (or the appropriate language code) to the root <html> opening tag.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'color-contrast': {
    name: 'Text Must Have Sufficient Contrast Ratio',
    criterion: 'WCAG 1.4.3 Contrast (Minimum) (Level AA)',
    simpleExplanation: 'Text is too faint or close to the background color, making it difficult or impossible to read.',
    technicalExplanation: 'The calculated contrast ratio between text foreground and background is below the required 4.5:1 ratio for normal text.',
    whyItMatters: 'People with low vision, color blindness, or anyone viewing screens in bright sunlight cannot read low-contrast text.',
    suggestedSolution: 'Darken foreground text or lighten background to guarantee at least 4.5:1 contrast.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'image-alt': {
    name: 'Images Must Have Descriptive Alternative Text',
    criterion: 'WCAG 1.1.1 Non-text Content (Level A)',
    simpleExplanation: 'This image is missing a text description for people who cannot see it.',
    technicalExplanation: '<img> element lacks an alt attribute or accessible name.',
    whyItMatters: 'Screen reader users hear file URLs or nothing at all, missing out on crucial graphics, charts, and diagrams.',
    suggestedSolution: 'Add alt="" for decorative graphics, or provide a concise human-authored description of the image content.',
    classification: 'Needs review',
    safeFixAvailable: true
  },
  'button-name': {
    name: 'Buttons Must Have Discernible Text or Accessible Name',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'A button has no visible text or label, so voice or screen reader users cannot tell what it does.',
    technicalExplanation: '<button> element has an empty accessible name computation (no text content, aria-label, or title).',
    whyItMatters: 'Blind and switch-device users cannot tell what action will occur when clicking the button.',
    suggestedSolution: 'Add visible text inside the button or provide an explicit aria-label describing its action.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'label': {
    name: 'Form Inputs Must Have Associated Labels',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'A form input field does not tell people what information is expected.',
    technicalExplanation: '<input>, <select>, or <textarea> element lacks a programmatically associated <label> or aria-label.',
    whyItMatters: 'Screen reader users moving from field to field hear "input field" without knowing what data to type.',
    suggestedSolution: 'Associate a <label htmlFor="..."> with the input id, or add an aria-label attribute.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'link-name': {
    name: 'Links Must Have Discernible Purpose',
    criterion: 'WCAG 2.4.4 Link Purpose (In Context) (Level A)',
    simpleExplanation: 'A link has generic or empty text, so users cannot tell where it leads.',
    technicalExplanation: '<a> element lacks text content or an accessible name explaining its destination.',
    whyItMatters: 'Users who navigate by jumping between links hear ambiguous labels like "click here" or silence.',
    suggestedSolution: 'Provide meaningful destination text or add an aria-label indicating where the link navigates.',
    classification: 'Needs review',
    safeFixAvailable: true
  },
  'target-size': {
    name: 'Touch Targets Must Have Sufficient Size',
    criterion: 'WCAG 2.5.8 Target Size (Minimum) (Level AA)',
    simpleExplanation: 'A clickable button or link is too small to tap accurately on a touchscreen or with motor impairments.',
    technicalExplanation: 'Interactive element bounding box is smaller than 24x24 CSS pixels.',
    whyItMatters: 'People with hand tremors, motor disabilities, or mobile users easily tap the wrong button.',
    suggestedSolution: 'Increase element padding or set min-height and min-width to at least 24px.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'heading-order': {
    name: 'Heading Levels Should Increase Incrementally',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'Headings skip levels, confusing the outline of the page for screen reader users.',
    technicalExplanation: 'Heading hierarchy skipped levels (e.g. <h1> followed by <h4> instead of <h2>).',
    whyItMatters: 'Screen reader users skim pages by jumping between headings; skipping levels disorients navigation.',
    suggestedSolution: 'Nest headings sequentially (h1 -> h2 -> h3) without skipping structural levels.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'aria-valid-attr': {
    name: 'ARIA Attributes Must Be Valid and Spelled Correctly',
    criterion: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    simpleExplanation: 'An accessibility code attribute is misspelled or invalid, causing screen readers to ignore it.',
    technicalExplanation: 'Element contains unknown or invalid ARIA attributes.',
    whyItMatters: 'Assistive software cannot interpret corrupted accessibility tags, leaving users without aids.',
    suggestedSolution: 'Correct the attribute spelling according to the W3C WAI-ARIA specification.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'tabindex': {
    name: 'Avoid Positive Tabindex Values',
    criterion: 'WCAG 2.4.3 Focus Order (Level A)',
    simpleExplanation: 'Keyboard focus jumps around unpredictably instead of moving smoothly down the page.',
    technicalExplanation: 'Element has tabIndex > 0, which disrupts natural sequential DOM keyboard navigation.',
    whyItMatters: 'Keyboard-only and switch users lose their place on the page when focus jumps out of order.',
    suggestedSolution: 'Set tabIndex to 0 to make focusable or -1 for programmatic focus, avoiding positive integers.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'landmark-one-main': {
    name: 'Page Must Contain a Main Landmark',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'The page lacks a main content container, making it harder to skip repetitive header links.',
    technicalExplanation: 'Document does not contain a <main> element or element with role="main".',
    whyItMatters: 'Keyboard and screen reader users must repeatedly tab through navigation headers to reach content.',
    suggestedSolution: 'Wrap primary page content in a semantic <main> landmark element.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  },
  'region': {
    name: 'All Content Should Reside in Landmark Regions',
    criterion: 'WCAG 1.3.1 Info and Relationships (Level A)',
    simpleExplanation: 'Page content is floating outside standard page regions (header, main, nav, footer).',
    technicalExplanation: 'Content resides outside HTML5 sectioning elements (<header>, <nav>, <main>, <footer>).',
    whyItMatters: 'Assistive technology users use landmark shortcuts to rapidly jump between sections.',
    suggestedSolution: 'Place content within semantic elements like <header>, <nav>, <main>, <aside>, or <footer>.',
    classification: 'Certified candidate',
    safeFixAvailable: true
  }
};

export default function IssueCard({
  issue,
  onApplyFix,
  fixing = false,
  appliedDiff = null
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const ruleId = issue.id || issue.rule || 'accessibility-rule';
  const kb = RULE_KNOWLEDGE_BASE[ruleId] || {};

  const name = issue.name || kb.name || issue.help || ruleId;
  const impact = issue.impact || 'moderate';
  const wcagCriterion = issue.wcagCriterion || kb.criterion || 'WCAG 2.1 & 2.2 Standard';
  const simpleExplanation = issue.simpleExplanation || kb.simpleExplanation || issue.help || 'Accessibility issue detected on this element that may make it difficult for people to use.';
  const technicalExplanation = issue.technicalExplanation || kb.technicalExplanation || issue.description || 'Failed axe-core accessibility assertion during DOM inspection.';
  const whyItMatters = issue.whyItMatters || kb.whyItMatters || simpleExplanation;
  const classification = issue.classification || kb.classification || 'Needs review';
  const suggestedSolution = issue.suggestedSolution || kb.suggestedSolution || 'Inspect the element in source code and ensure it complies with WCAG guidelines.';
  const safeFixAvailable = issue.safeFixAvailable ?? kb.safeFixAvailable ?? false;

  const nodes = issue.nodes || [];
  const primaryLocation = issue.primaryLocation;
  const verificationStatus = issue.verificationStatus;
  const rollbackReason = issue.rollbackReason;
  const beforeCode = issue.beforeCode;
  const afterCode = issue.afterCode;

  // Severity styling
  const severityBadge = {
    critical: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 border-red-300 dark:border-red-700',
    serious: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    moderate: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    minor: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-700'
  }[impact] || 'bg-slate-100 text-slate-800 border-slate-300';

  // Classification status styling
  const statusBadge = {
    'Certified candidate': 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    'Certified': 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    'Needs review': 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    'Unfixable': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
  }[classification] || 'bg-slate-100 text-slate-800';

  const firstNode = nodes[0] || {};
  const locationText = primaryLocation?.dataLoc || primaryLocation?.selector || firstNode.target?.join(' ') || firstNode.html || 'DOM Node';

  const hasCodeDiff = appliedDiff || (beforeCode && afterCode);

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden transition-all">
      {/* Card Header */}
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${severityBadge}`}>
              {impact} Severity
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
              Repair Status: {classification}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {ruleId}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {name}
          </h3>

          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mt-0.5">
            {wcagCriterion}
          </p>

          {/* Simple Explanation for Normal Users */}
          <div className="mt-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-1">
              Everyday Impact (Why it matters for people)
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {simpleExplanation}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 flex-shrink-0">
          {safeFixAvailable && onApplyFix && (
            <button
              type="button"
              onClick={() => onApplyFix(ruleId)}
              disabled={fixing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>{fixing ? 'Applying Fix...' : 'Apply Safe Fix'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            {expanded ? '▲ Hide Details' : '▼ Developer Details'}
          </button>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {expanded && (
        <div className="px-5 pb-6 sm:px-6 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-4 bg-slate-50 dark:bg-slate-900/80">
          {/* Affected Target Location */}
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1">
              Affected Element / Source Location
            </span>
            <code className="block p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800">
              {locationText}
            </code>
          </div>

          {/* Why it Matters for People */}
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1">
              Why It Matters For People with Disabilities
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {whyItMatters}
            </p>
          </div>

          {/* Technical Developer Explanation */}
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1">
              Technical Explanation & AST Analysis
            </span>
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {technicalExplanation}
            </p>
          </div>

          {/* Suggested Solution */}
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1">
              Recommended Remediation Strategy
            </span>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-100 font-medium leading-relaxed">
              {suggestedSolution}
            </div>
          </div>

          {/* Verification Status after Re-scan */}
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white block mb-1">
              Verification Status After Re-scan
            </span>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
              {verificationStatus ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Re-scan verified: {verificationStatus}
                </span>
              ) : safeFixAvailable ? (
                <span>Re-scan verification executes automatically upon fix application to guarantee zero regressions.</span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">Manual review or architectural overhaul required.</span>
              )}
            </div>
          </div>

          {/* Rollback Explanation if needed */}
          {(rollbackReason || classification === 'Unfixable') && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-xs text-red-900 dark:text-red-200">
              <span className="font-extrabold block mb-0.5">Safety & Rollback Protection:</span>
              <p className="leading-relaxed">
                {rollbackReason || 'If an automated rewrite fails post-scan verification or creates new accessibility violations, it is automatically rolled back to preserve codebase integrity.'}
              </p>
            </div>
          )}

          {/* Live Diff Viewer toggle if diff exists */}
          {hasCodeDiff && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowDiff(!showDiff)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
              >
                {showDiff ? '▲ Hide Code Comparison' : '▼ View Before / After Code Comparison'}
              </button>
              {showDiff && (
                appliedDiff ? (
                  <DiffViewer diffs={[appliedDiff]} />
                ) : (
                  <DiffViewer oldCode={beforeCode} newCode={afterCode} filename="RemediatedComponent.jsx" />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
