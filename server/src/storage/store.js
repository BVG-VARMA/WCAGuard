import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DATA_DIR = path.resolve(__dirname, '../../../data');

const SCANS_DIR = path.join(ROOT_DATA_DIR, 'scans');
const REPORTS_DIR = path.join(ROOT_DATA_DIR, 'reports');
const CERTS_DIR = path.join(ROOT_DATA_DIR, 'certificates');
const TMP_DIR = path.join(ROOT_DATA_DIR, 'tmp');

[SCANS_DIR, REPORTS_DIR, CERTS_DIR, TMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

export const store = {
  // Scans
  saveScan(scanId, data) {
    const filePath = path.join(SCANS_DIR, `${scanId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return data;
  },

  getScan(scanId) {
    const filePath = path.join(SCANS_DIR, `${scanId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  },

  listScans() {
    if (!fs.existsSync(SCANS_DIR)) return [];
    return fs.readdirSync(SCANS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(SCANS_DIR, f), 'utf8'));
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  // Reports
  saveReport(reportId, data) {
    const filePath = path.join(REPORTS_DIR, `${reportId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    // Also store individual certificates for quick lookup
    if (Array.isArray(data.certificates)) {
      data.certificates.forEach(cert => {
        if (cert.certificateId) {
          const certPath = path.join(CERTS_DIR, `${cert.certificateId}.json`);
          fs.writeFileSync(certPath, JSON.stringify(cert, null, 2), 'utf8');
        }
      });
    }
    return data;
  },

  getReport(reportId) {
    const filePath = path.join(REPORTS_DIR, `${reportId}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  },

  // Certificates
  getCertificate(certificateId) {
    const certPath = path.join(CERTS_DIR, `${certificateId}.json`);
    if (fs.existsSync(certPath)) {
      return JSON.parse(fs.readFileSync(certPath, 'utf8'));
    }
    // Fallback: search in reports
    const reports = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json'));
    for (const rFile of reports) {
      try {
        const report = JSON.parse(fs.readFileSync(path.join(REPORTS_DIR, rFile), 'utf8'));
        const found = report.certificates?.find(c => c.certificateId === certificateId);
        if (found) return found;
      } catch {
        // continue
      }
    }
    return null;
  },

  // Cleanup temporary sandbox directories
  cleanupTmp() {
    try {
      if (fs.existsSync(TMP_DIR)) {
        const entries = fs.readdirSync(TMP_DIR);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        entries.forEach(entry => {
          const entryPath = path.join(TMP_DIR, entry);
          const stat = fs.statSync(entryPath);
          if (stat.mtimeMs < oneHourAgo) {
            fs.rmSync(entryPath, { recursive: true, force: true });
          }
        });
      }
    } catch (err) {
      console.warn('Temporary directory cleanup error:', err.message);
    }
  }
};
