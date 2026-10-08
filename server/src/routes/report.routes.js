import express from 'express';
import { store } from '../storage/store.js';
import { streamPdfReport } from '../report/pdf.js';

const router = express.Router();

/**
 * GET /report/:id (JSON report)
 */
router.get('/report/:id', (req, res) => {
  const report = store.getReport(req.params.id) || store.getScan(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found for specified ID.' });
  }
  res.json(report);
});

/**
 * GET /report/:id/pdf (Downloadable PDF audit report)
 */
router.get('/report/:id/pdf', (req, res) => {
  const report = store.getReport(req.params.id) || store.getScan(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found for specified ID.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="WCAGuard-Report-${report.reportId || report.scanId}.pdf"`);

  streamPdfReport(report, res);
});

/**
 * GET /certificate/:id (Individual Proof Certificate JSON)
 */
router.get('/certificate/:id', (req, res) => {
  const cert = store.getCertificate(req.params.id);
  if (!cert) {
    return res.status(404).json({ error: `Certificate "${req.params.id}" not found.` });
  }
  res.json(cert);
});

/**
 * GET /scans (List previous scans)
 */
router.get('/scans', (req, res) => {
  const scans = store.listScans().map(s => ({
    scanId: s.scanId,
    url: s.url || 'React JSX Snippet',
    timestamp: s.timestamp,
    score: s.score || s.scoreAfter || s.scoreBefore,
    violationsCount: s.totalViolations || (s.violations || []).length
  }));
  res.json({ scans });
});

export default router;
