import { useState } from 'react';
import { scanUrl, analyzeCode, uploadProject, fixProject, submitReview } from '../api/client.js';

export function useScan() {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const [scanResult, setScanResult] = useState(null);
  const [fixResult, setFixResult] = useState(null);
  const [selectedRules, setSelectedRules] = useState([]);

  const handleScan = async (url, environment = 'public') => {
    setLoading(true);
    setError('');
    setStatusMessage('Launching headless Chromium & running axe-core analysis...');
    setFixResult(null);

    try {
      const data = await scanUrl(url, environment);
      setScanResult(data);
      setSelectedRules((data.violations || []).map(v => v.id));
      setStatusMessage('');
      return data;
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCode = async (code, options = {}) => {
    setLoading(true);
    setError('');
    setStatusMessage(
      options.language === 'html'
        ? 'Parsing HTML & evaluating WCAG 2.1 AA rules...'
        : 'Parsing source code & running deterministic WCAG rules...'
    );
    setFixResult(null);

    try {
      const data = await analyzeCode(code, options);
      setScanResult(data);
      // For code analysis, fixes and certificates are computed immediately
      setFixResult(data);
      setSelectedRules((data.violations || []).map(v => v.id));
      setStatusMessage('');
      return data;
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    setError('');
    setStatusMessage('Uploading project zip to safe AST sandbox...');

    try {
      const data = await uploadProject(file);
      setStatusMessage('Project uploaded. Ready to scan.');
      return data;
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFix = async (targetUrl, projectPath = null) => {
    if (!scanResult) return;

    setLoading(true);
    setError('');
    setStatusMessage('Cloning to temp sandbox & rewriting AST code...');

    try {
      const data = await fixProject({
        scanId: scanResult.scanId,
        rules: selectedRules.length > 0 ? selectedRules : null,
        targetUrl,
        projectPath
      });
      setFixResult(data);
      setStatusMessage('');
      return data;
    } catch (err) {
      setError(err.message);
      setStatusMessage('');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId, fixId, action, text) => {
    try {
      await submitReview({ reportId, fixId, action, text });
      setFixResult(prev => {
        if (!prev) return prev;
        const updatedQueue = (prev.reviewQueue || []).map(item =>
          item.fixId === fixId ? { ...item, userDecision: action, suggestedValue: text || item.suggestedValue } : item
        );
        const updatedCerts = (prev.certificates || []).map(c =>
          c.fixId === fixId ? { ...c, status: action === 'rejected' ? 'UNFIXABLE' : 'CERTIFIED' } : c
        );
        return {
          ...prev,
          reviewQueue: updatedQueue,
          certificates: updatedCerts
        };
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleRule = (ruleId) => {
    setSelectedRules(prev =>
      prev.includes(ruleId) ? prev.filter(r => r !== ruleId) : [...prev, ruleId]
    );
  };

  const selectAllRules = () => {
    if (!scanResult) return;
    if (selectedRules.length === (scanResult.violations || []).length) {
      setSelectedRules([]);
    } else {
      setSelectedRules((scanResult.violations || []).map(v => v.id));
    }
  };

  return {
    loading,
    statusMessage,
    error,
    setError,
    scanResult,
    fixResult,
    selectedRules,
    handleScan,
    handleAnalyzeCode,
    handleUpload,
    handleFix,
    handleReview,
    toggleRule,
    selectAllRules
  };
}
