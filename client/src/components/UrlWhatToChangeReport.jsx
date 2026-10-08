import React, { useState } from 'react';
import { getPdfDownloadUrl, downloadPdfReport } from '../api/client.js';

/**
 * Stage 3: URL "What to Change" Live DOM Remediation Report Component
 * Strictly enforces:
 * - NO automatic fixing and NO fixed-code download
 * - Labeled "Verified on live DOM, not source."
 * - Lists rule, WCAG criterion, impact, selector, current HTML snippet, recommended change, plain-language reason
 * - Grouped by impact (Critical, Serious, Moderate, Minor)
 * - Copy and Export-as-PDF support
 */
export default function UrlWhatToChangeReport({
  scanResult,
  onRescanUrl = null,
  rescanning = false
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!scanResult) return null;

  const {
    url,
    scanId,
    timestamp,
    score = 50,
    violations = []
  } = scanResult;

  // Group violations by impact
  const impactOrder = ['critical', 'serious', 'moderate', 'minor'];
  const groupedIssues = {
    critical: [],
    serious: [],
    moderate: [],
    minor: []
  };

  violations.forEach((v) => {
    const impact = (v.impact || 'moderate').toLowerCase();
    if (groupedIssues[impact]) {
      groupedIssues[impact].push(v);
    } else {
      groupedIssues.moderate.push(v);
    }
  });

  // Synthesize suggested snippets for common rules if not provided
  const getSuggestedSnippet = (issue) => {
    const node = issue.nodes?.[0] || {};
    const html = node.html || '<element>';
    const ruleId = issue.id || issue.ruleId;

    if (ruleId === 'image-alt') {
      if (html.includes('alt=')) return html.replace(/alt=["'][^"']*["']/, 'alt="Descriptive text of image purpose"');
      return html.replace(/<img\b/, '<img alt="Descriptive text of image purpose"');
    }
    if (ruleId === 'button-name') {
      if (html.includes('aria-label=')) return html.replace(/aria-label=["'][^"']*["']/, 'aria-label="Action description"');
      return html.replace(/<button\b/, '<button aria-label="Action description"');
    }
    if (ruleId === 'link-name') {
      if (html.includes('aria-label=')) return html.replace(/aria-label=["'][^"']*["']/, 'aria-label="Destination page description"');
      return html.replace(/<a\b/, '<a aria-label="Destination page description"');
    }
    if (ruleId === 'label') {
      return `<label for="field-id">Field Label</label>\n${html.replace(/<input\b/, '<input id="field-id"')}`;
    }
    if (ruleId === 'color-contrast') {
      const check = node.any?.find(c => c.id === 'color-contrast') || node.all?.find(c => c.id === 'color-contrast');
      const data = check?.data || {};
      const selector = node.target?.join(' ') || issue.selector || '';

      // Default safe compliant text color: #4b5563 gives 7.1:1 ratio against #ffffff (exceeds WCAG AA 4.5:1)
      let compliantColor = '#4b5563';
      if (data.bgColor) {
        const bg = String(data.bgColor).toLowerCase();
        if (bg.includes('0,') || bg.includes('1e') || bg === '#000000' || bg === '#111827' || bg === '#1e3a8a') {
          compliantColor = '#f3f4f6';
        }
      }

      let fixedHtml = html;
      if (html.includes('style="')) {
        fixedHtml = html.replace(/style=["']([^"']*)["']/, `style="$1; color: ${compliantColor};"`);
      } else {
        fixedHtml = html.replace(/^<([a-zA-Z0-9]+)(\s|>)/, `<$1 style="color: ${compliantColor};"$2`);
      }

      if (selector && selector !== 'DOM Element') {
        return `${fixedHtml}\n\n/* Or update in your stylesheet: */\n${selector} {\n  color: ${compliantColor}; /* Meets WCAG AA >= 4.5:1 contrast */\n}`;
      }

      return fixedHtml;
    }
    if (ruleId === 'html-has-lang') {
      return html.replace(/<html\b/, '<html lang="en"');
    }
    if (ruleId === 'target-size') {
      if (html.includes('style="')) {
        return html.replace(/style=["']([^"']*)["']/, 'style="$1; min-width: 24px; min-height: 24px; padding: 6px 12px; display: inline-flex; align-items: center; justify-content: center;"');
      }
      return html.replace(/^<([a-zA-Z0-9]+)(\s|>)/, '<$1 style="min-width: 24px; min-height: 24px; padding: 6px 12px; display: inline-flex; align-items: center; justify-content: center;"$2');
    }
    if (ruleId === 'table-missing-headers') {
      return `<table>\n  <thead>\n    <tr>\n      <th scope="col">Course Title</th>\n      <th scope="col">Duration</th>\n      <th scope="col">Tuition</th>\n    </tr>\n  </thead>\n  <tbody>\n    ${html.replace(/^<table[^>]*>\s*/, '').replace(/<\/table>$/, '')}\n  </tbody>\n</table>`;
    }
    if (ruleId === 'video-caption') {
      return html.replace(/<\/video>/, '  <track kind="captions" src="/captions.vtt" srclang="en" label="English" default>\n</video>');
    }
    if (ruleId === 'moving-content-no-pause') {
      return `/* 1. Add Pause/Stop toggle button in HTML:\n<button type="button" onclick="toggleMotion()">Pause Animation</button>\n\n/* 2. And support prefers-reduced-motion in CSS: */\n@media (prefers-reduced-motion: reduce) {\n  .moving-ball {\n    animation: none !important;\n  }\n}`;
    }
    if (ruleId === 'heading-order') {
      return `/* Adjust heading hierarchy: replace <h4> with <h2> below <h1> */\n${html.replace(/<(\/?)h4\b/g, '<$1h2')}`;
    }
    if (ruleId === 'landmark-one-main') {
      return `<main id="main-content" role="main">\n  <!-- Wrap primary page content here -->\n</main>`;
    }
    if (ruleId === 'aria-roles') {
      const cleanHtml = html.replace(/\s*role=["'][^"']*["']/, '');
      const validRoleHtml = html.replace(/role=["'][^"']*["']/, 'role="region"');
      return `<!-- Option 1: Remove the invalid role attribute -->\n${cleanHtml}\n\n<!-- Option 2: Or replace with a valid WAI-ARIA role (e.g. region, status, alert) -->\n${validRoleHtml}`;
    }
    if (ruleId === 'aria-valid-attr') {
      let fixed = html;
      if (fixed.includes('aria-labeledby')) {
        fixed = fixed.replace('aria-labeledby', 'aria-labelledby');
      }
      return `<!-- Fix misspelled attribute or remove invalid ARIA attribute -->\n${fixed}`;
    }
    if (ruleId === 'aria-valid-attr-value' || ruleId === 'aria-allowed-attr') {
      return `<!-- Remove incompatible ARIA attribute from this element -->\n${html.replace(/\s*aria-[a-z0-9_-]+=["'][^"']*["']/i, '')}`;
    }
    if (issue.suggestedSnippet) return issue.suggestedSnippet;
    if (issue.suggestedSolution && issue.suggestedSolution.startsWith('<')) return issue.suggestedSolution;
    return `<!-- Recommended fix: ${issue.suggestedSolution || issue.help || 'Update element attributes'} -->\n${html}`;
  };

  const handleCopySnippet = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyFullReport = () => {
    let reportText = `# WCAGuard Live DOM "What to Change" Report\n`;
    reportText += `Target URL: ${url}\n`;
    reportText += `Notice: Verified on live DOM, not source. Automated 100% WCAG conformance is never claimed.\n\n`;

    impactOrder.forEach((impact) => {
      const items = groupedIssues[impact];
      if (items.length === 0) return;
      reportText += `## ${impact.toUpperCase()} IMPACT (${items.length} items)\n\n`;
      items.forEach((item, idx) => {
        const node = item.nodes?.[0] || {};
        const selector = node.target?.join(' ') || item.selector || 'Element';
        reportText += `### ${idx + 1}. ${item.id} - ${item.wcagCriterion || item.help}\n`;
        reportText += `- Selector: \`${selector}\`\n`;
        reportText += `- Current HTML: \`${node.html || '<element>'}\`\n`;
        reportText += `- Recommended Change: \`${getSuggestedSnippet(item)}\`\n`;
        reportText += `- Plain-language reason: ${item.simpleExplanation || item.description || item.whyItMatters}\n\n`;
      });
    });

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Header Banner: Labeled Verified on live DOM, not source */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-400/50 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <span>🌐</span>
              <span>Verified on live DOM, not source</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              What to Change Remediation Guidance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-mono truncate">
              {url}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onRescanUrl && (
              <button
                type="button"
                disabled={rescanning}
                onClick={() => onRescanUrl(url)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ring-2 ring-blue-400/40"
                title="Re-scan the live URL to verify updates made to your webpage"
              >
                <span className={rescanning ? 'animate-spin inline-block' : ''}>🔄</span>
                <span>{rescanning ? 'Re-scanning Updated Page...' : 'Re-scan Updated Webpage'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyFullReport}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>📋</span>
              <span>{copiedReport ? '✓ Copied Report!' : 'Copy Report'}</span>
            </button>

            <button
              type="button"
              disabled={downloadingPdf}
              onClick={async () => {
                setDownloadingPdf(true);
                try {
                  await downloadPdfReport(scanId);
                } catch (e) {
                  window.open(getPdfDownloadUrl(scanId), '_blank');
                } finally {
                  setDownloadingPdf(false);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>📥</span>
              <span>{downloadingPdf ? 'Exporting PDF...' : 'Export as PDF'}</span>
            </button>
          </div>
        </div>

        {/* Mandatory Live DOM Legal Callout */}
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-2 text-amber-300">
            <span>ℹ️</span>
            <span>Verified on live DOM, not source.</span>
          </div>
          <p>
            The URL report has no Certified fix status for the owner's source, because we cannot edit their site.
            Automatic source fixing and fixed-code downloads are disabled for live websites. Use the actionable guide below to implement updates directly in your HTML or component templates. WCAGuard never claims 100% WCAG conformance.
          </p>
        </div>
      </div>

      {/* Issues Grouped By Impact */}
      <div className="space-y-8">
        {impactOrder.map((impactLevel) => {
          const items = groupedIssues[impactLevel];
          if (items.length === 0) return null;

          const badgeStyles = {
            critical: 'bg-red-950/70 text-red-300 border-red-500/50',
            serious: 'bg-amber-950/70 text-amber-300 border-amber-500/50',
            moderate: 'bg-teal-950/70 text-teal-300 border-teal-500/50',
            minor: 'bg-slate-800 text-slate-300 border-slate-700'
          };

          return (
            <div key={impactLevel} className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                    badgeStyles[impactLevel]
                  }`}
                >
                  {impactLevel} Impact ({items.length})
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {impactLevel === 'critical'
                    ? 'Blocks access completely for people using assistive tools'
                    : impactLevel === 'serious'
                    ? 'Creates major confusion or navigation disruption'
                    : 'Suboptimal user experience or non-standard relationship'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {items.map((issue, idx) => {
                  const node = issue.nodes?.[0] || {};
                  const selector = node.target?.join(' ') || issue.selector || 'DOM Element';
                  const currentHtml = node.html || '<element>';
                  const suggestedSnippet = getSuggestedSnippet(issue);
                  const reason = issue.simpleExplanation || issue.whyItMatters || issue.description || 'Accessibility requirement';
                  const uniqueKey = `${issue.id}-${idx}`;

                  return (
                    <div
                      key={uniqueKey}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3.5"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              {issue.id}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {issue.wcagCriterion || issue.help}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Selector: <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{selector}</code>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopySnippet(uniqueKey, suggestedSnippet)}
                          className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                        >
                          {copiedId === uniqueKey ? '✓ Copied' : 'Copy Suggestion'}
                        </button>
                      </div>

                      {/* Code comparison: Current vs Recommended */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                        {/* Current HTML Snippet */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                            Current HTML Snippet:
                          </span>
                          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200 overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
                            {currentHtml}
                          </div>
                        </div>

                        {/* Recommended Change as Suggested Snippet */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                            Recommended Change:
                          </span>
                          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 text-teal-950 dark:text-teal-200 overflow-x-auto whitespace-pre-wrap break-all text-[11px]">
                            {suggestedSnippet}
                          </div>
                        </div>
                      </div>

                      {/* Plain-Language Reason */}
                      <div className="pt-1 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-200 select-none">Reason:</span>
                        <span>{reason}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Re-scan Call To Action */}
      {onRescanUrl && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <span>⚡</span>
              <span>Live DOM Verification</span>
            </div>
            <h3 className="text-xl font-black text-white">
              Made updates to your code?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Re-scan now to verify that your alt text, color contrast, and label fixes resolved all WCAG violations without browser cache.
            </p>
          </div>

          <button
            type="button"
            disabled={rescanning}
            onClick={() => onRescanUrl(url)}
            className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black transition-all shadow-lg flex items-center gap-2 whitespace-nowrap cursor-pointer hover:scale-105"
          >
            <span className={rescanning ? 'animate-spin inline-block' : ''}>🔄</span>
            <span>{rescanning ? 'Re-scanning Live DOM...' : 'Re-scan Updated Webpage'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
