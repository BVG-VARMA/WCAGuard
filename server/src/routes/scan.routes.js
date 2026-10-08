import express from 'express';
import { runScan } from '../scanner/scanner.js';
import { validateTargetUrl } from '../security/security.js';
import { uploadMiddleware } from '../security/upload.js';
import { store } from '../storage/store.js';
import { logger } from '../utils/logger.js';
import { classifyAllViolations } from '../scanner/classifier.js';
import { localizeViolations } from '../scanner/localizer.js';
import { analyzeAndRepairCode, analyzeAndRepairJsxCode } from '../fixer/codeAnalyzer.js';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TMP_DIR = path.resolve(__dirname, '../../../data/tmp');

const router = express.Router();

/**
 * POST /scan { url, environment: 'public' | 'local' }
 */
router.post('/scan', async (req, res) => {
  try {
    const { url, environment = 'public' } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Missing "url" parameter.' });
    }

    const validation = validateTargetUrl(url, environment);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    logger.info(`Scanning URL: ${validation.sanitizedUrl} [Mode: ${environment}]`);
    const rawResult = await runScan(validation.sanitizedUrl);

    // Localize & classify violations with honest explanations
    const localizedViolations = localizeViolations(rawResult.violations);
    const classifiedViolations = classifyAllViolations(localizedViolations);

    const scanResult = {
      ...rawResult,
      environment,
      violations: classifiedViolations,
      counts: {
        total: classifiedViolations.length,
        certified: classifiedViolations.filter(v => v.classification === 'Certified candidate').length,
        needsReview: classifiedViolations.filter(v => v.classification === 'Needs review').length,
        unfixable: classifiedViolations.filter(v => v.classification === 'Unfixable').length
      }
    };

    // Save scan to store
    store.saveScan(scanResult.scanId, scanResult);

    res.json(scanResult);
  } catch (err) {
    logger.error('Scan failed:', err);
    res.status(500).json({ error: `Scan execution failed: ${err.message}` });
  }
});

/**
 * POST /analyze-code { code, language, filename }
 * Parses React JSX or HTML code safely (never executes code)
 */
router.post('/analyze-code', async (req, res) => {
  try {
    const { code, language, filename } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code in request body.' });
    }

    logger.info(`Analyzing raw source code snippet (${code.length} characters, language: ${language || 'auto'})`);
    const result = await analyzeAndRepairCode(code, { language, filename });

    // Save as scan record and report record for certificate persistence
    store.saveScan(result.scanId, result);
    store.saveReport(result.scanId, result);

    res.json(result);
  } catch (err) {
    logger.error('Code analysis failed:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Failed to analyze code.' });
  }
});

/**
 * POST /scan/upload - Zipped React project upload (parsed statically only)
 */
router.post('/scan/upload', uploadMiddleware.single('project'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const uploadId = `upload-${Date.now()}`;
    const extractPath = path.join(TMP_DIR, uploadId);

    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(extractPath, true);

    fs.unlinkSync(req.file.path);

    res.json({
      uploadId,
      path: extractPath,
      message: 'Project unzipped to temporary sandbox. Statically parsed only.'
    });
  } catch (err) {
    logger.error('Upload failed:', err);
    res.status(500).json({ error: `Upload processing failed: ${err.message}` });
  }
});

export default router;
