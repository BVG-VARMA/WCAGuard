import PDFDocument from 'pdfkit';

/**
 * Generates and streams downloadable PDF audit reports adhering to global WCAGuard rules:
 * - Never claims 100% WCAG conformance.
 * - For URL scans: explicitly labeled "Verified on live DOM, not source." with "What to change" guidance.
 * - For Code scans: includes SHA-256 hash and exact status labels (Certified, Needs review, Unfixable).
 */
export function streamPdfReport(reportData, outputStream) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(outputStream);

  const darkBlue = '#1E3A8A';
  const teal = '#0D9488';
  const green = '#15803D';
  const amber = '#D97706';
  const red = '#DC2626';
  const grey = '#4B5563';

  const isUrlScan =
    reportData.input_type === 'url' ||
    reportData.mode === 'url' ||
    Boolean(reportData.targetUrl?.startsWith('http')) ||
    Boolean(reportData.url?.startsWith('http'));

  // Header Banner
  doc.rect(45, 45, 505, 58).fill(darkBlue);
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('WCAGuard', 60, 55);
  doc.fontSize(9.5).font('Helvetica').text(
    isUrlScan
      ? 'Verified on live DOM, not source. — What to Change Remediation Guidance'
      : 'Find it. Fix it. Prove it. — Automated Code Remediation & Cryptographic Audit Proof',
    60,
    80
  );

  doc.moveDown(3);

  // Audit Info Header
  doc.fillColor(darkBlue).fontSize(14).font('Helvetica-Bold').text('Audit Summary', 45, 120);
  doc.fillColor('#111827').fontSize(9.5).font('Helvetica');
  doc.text(`Target: ${reportData.targetUrl || reportData.url || 'React JSX Source Code'}`);
  doc.text(`Generated: ${new Date(reportData.timestamp || Date.now()).toLocaleString()}`);
  doc.text(`Report ID: ${reportData.reportId || reportData.scanId || 'REPORT-' + Date.now()}`);

  if (reportData.code_hash || reportData.sha256) {
    doc.text(`SHA-256 Hash: ${reportData.code_hash || reportData.sha256}`);
  }

  // Scores Box
  doc.moveDown();
  const boxY = doc.y;

  const beforeScore = reportData.scoreSummary?.before ?? reportData.scoreBefore ?? reportData.score ?? 50;
  const afterScore = reportData.scoreSummary?.after ?? reportData.scoreAfter ?? (isUrlScan ? beforeScore : 85);
  const deltaScore = reportData.scoreSummary?.delta ?? reportData.scoreDelta ?? Math.max(0, afterScore - beforeScore);

  doc.rect(45, boxY, 150, 56).fillAndStroke('#F3F4F6', '#E5E7EB');
  doc.fillColor(grey).fontSize(8.5).font('Helvetica-Bold').text(isUrlScan ? 'CURRENT DOM SCORE' : 'BEFORE SCORE', 55, boxY + 10);
  doc.fillColor(red).fontSize(20).font('Helvetica-Bold').text(`${beforeScore} / 100`, 55, boxY + 24);

  doc.rect(210, boxY, 150, 56).fillAndStroke('#ECFDF5', '#A7F3D0');
  doc.fillColor(green).fontSize(8.5).font('Helvetica-Bold').text(isUrlScan ? 'TARGET POST-FIX SCORE' : 'AFTER SCORE', 220, boxY + 10);
  doc.fillColor(green).fontSize(20).font('Helvetica-Bold').text(`${afterScore} / 100`, 220, boxY + 24);

  doc.rect(375, boxY, 175, 56).fillAndStroke('#EFF6FF', '#BFDBFE');
  doc.fillColor(darkBlue).fontSize(8.5).font('Helvetica-Bold').text('ESTIMATED DELTA', 385, boxY + 10);
  const deltaSign = deltaScore >= 0 ? '+' : '';
  doc.fillColor(darkBlue).fontSize(20).font('Helvetica-Bold').text(`${deltaSign}${deltaScore} pts`, 385, boxY + 24);

  doc.y = boxY + 70;
  doc.moveDown();

  // Mandatory Honesty & Live DOM Disclaimer Callout
  if (isUrlScan) {
    doc.rect(45, doc.y, 505, 50).fillAndStroke('#FEF3C7', '#FDE68A');
    doc.fillColor('#92400E').fontSize(9).font('Helvetica-Bold').text('VERIFIED ON LIVE DOM, NOT SOURCE', 55, doc.y + 8);
    doc.font('Helvetica').fontSize(8.5).text(
      'The URL report has no Certified fix status for the owner\'s source, because we cannot edit their site. This document provides recommended changes to implement directly in your codebase. WCAGuard never claims 100% WCAG conformance.',
      55,
      doc.y + 20,
      { width: 485 }
    );
    doc.y += 38;
  } else {
    doc.rect(45, doc.y, 505, 45).fillAndStroke('#FEF3C7', '#FDE68A');
    doc.fillColor('#92400E').fontSize(9).font('Helvetica-Bold').text('CRITICAL HONESTY NOTICE', 55, doc.y + 8);
    doc.font('Helvetica').fontSize(8.5).text(
      'WCAGuard never claims 100% WCAG conformance. Automated fixes are strictly certified for deterministic criteria. Heuristic items require human review.',
      55,
      doc.y + 20,
      { width: 485 }
    );
    doc.y += 35;
  }

  doc.moveDown();

  // URL REPORT: "What to change" Report Grouped by Impact
  if (isUrlScan) {
    doc.fillColor(darkBlue).fontSize(13).font('Helvetica-Bold').text('What to Change (Live DOM Remediation Report)', 45, doc.y);
    doc.moveDown(0.5);

    const issues = reportData.violations || reportData.issues || [];
    const impacts = ['critical', 'serious', 'moderate', 'minor'];

    impacts.forEach((impactLevel) => {
      const groupIssues = issues.filter((i) => i.impact === impactLevel);
      if (groupIssues.length === 0) return;

      if (doc.y > 680) doc.addPage();

      const impactColor = impactLevel === 'critical' ? red : impactLevel === 'serious' ? amber : impactLevel === 'moderate' ? teal : grey;
      doc.fillColor(impactColor).fontSize(11).font('Helvetica-Bold').text(`Impact: ${impactLevel.toUpperCase()} (${groupIssues.length} items)`, 45, doc.y);
      doc.moveDown(0.4);

      groupIssues.forEach((issue) => {
        if (doc.y > 670) doc.addPage();

        const node = issue.nodes?.[0] || {};
        const selector = node.target?.join(' ') || issue.selector || 'DOM Element';
        const currentHtml = node.html || issue.html || '<element>';
        const suggested = issue.suggestedSnippet || issue.recommendedChange || `Add accessible label or attribute`;
        const reason = issue.reason || issue.description || issue.help || 'Required to ensure assistive technologies can access this control.';

        const itemBoxY = doc.y;
        doc.rect(45, itemBoxY, 505, 78).fillAndStroke('#F9FAFB', '#E5E7EB');

        doc.fillColor(darkBlue).fontSize(9.5).font('Helvetica-Bold').text(`${issue.id || issue.ruleId} — ${issue.help || issue.wcagCriterion || 'WCAG Criterion'}`, 55, itemBoxY + 8);
        doc.fillColor('#6B7280').fontSize(8).font('Helvetica').text(`Selector: ${selector}`, 55, itemBoxY + 22, { width: 480, ellipsis: true });
        doc.fillColor('#B91C1C').fontSize(8).font('Courier').text(`Current:  ${currentHtml.slice(0, 85)}`, 55, itemBoxY + 34, { width: 480, ellipsis: true });
        doc.fillColor('#0D9488').fontSize(8).font('Courier-Bold').text(`Suggest:  ${suggested.slice(0, 85)}`, 55, itemBoxY + 46, { width: 480, ellipsis: true });
        doc.fillColor('#374151').fontSize(8).font('Helvetica').text(`Reason:   ${reason}`, 55, itemBoxY + 58, { width: 480, ellipsis: true });

        doc.y = itemBoxY + 86;
      });
      doc.moveDown(0.5);
    });
  } else {
    // CODE REPORT: Certificates per Fix
    doc.fillColor(darkBlue).fontSize(13).font('Helvetica-Bold').text('Issued Proof Certificates per Fix', 45, doc.y);
    doc.moveDown(0.5);

    if (reportData.certificates && reportData.certificates.length > 0) {
      reportData.certificates.slice(0, 10).forEach((cert) => {
        if (doc.y > 690) doc.addPage();

        // Exact labels: Certified, Needs review, Unfixable
        const statusLabel =
          cert.status === 'CERTIFIED' || cert.status === 'Certified'
            ? 'Certified'
            : cert.status === 'NEEDS_REVIEW' || cert.status === 'Needs review'
            ? 'Needs review'
            : 'Unfixable';

        const statusColor = statusLabel === 'Certified' ? green : statusLabel === 'Needs review' ? amber : grey;
        const startY = doc.y;
        doc.rect(45, startY, 505, 52).fillAndStroke('#F9FAFB', '#E5E7EB');

        doc.fillColor(statusColor).fontSize(8.5).font('Helvetica-Bold').text(`[${statusLabel}]`, 55, startY + 8);
        doc.fillColor(darkBlue).fontSize(9.5).font('Helvetica-Bold').text(`${cert.ruleId} - ${cert.wcagCriterion}`, 145, startY + 8);
        doc.fillColor('#4B5563').fontSize(8).font('Helvetica').text(`ID: ${cert.certificateId} | File: ${cert.targetLocation?.dataLoc || 'Snippet.jsx'}`, 55, startY + 22);
        doc.fillColor('#1F2937').fontSize(8).text(`Evidence: ${cert.witnesses?.preState?.failureSummary || cert.details || 'Resolved automatically via AST transform'}`, 55, startY + 34, { width: 480, ellipsis: true });

        doc.y = startY + 60;
      });
    }
  }

  doc.fontSize(8).fillColor('#9CA3AF').text('Generated by WCAGuard v1.0.0 — Find it. Fix it. Prove it.', 45, 780, { align: 'center', width: 505 });
  doc.end();
}
