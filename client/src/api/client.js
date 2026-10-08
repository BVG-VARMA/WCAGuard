/**
 * WCAGuard Frontend API Client
 * Connects to Express backend for Playwright scanning, Babel AST code analysis, fixes, verifications, and reports.
 * Automatically attaches Supabase JWT Bearer token to all /api requests.
 */

export function getAuthHeaders() {
  const headers = {};

  // 1. Check custom mock session
  const mockRaw =
    localStorage.getItem('wcaguard_mock_session') ||
    sessionStorage.getItem('wcaguard_mock_session');
  if (mockRaw) {
    try {
      const parsed = JSON.parse(mockRaw);
      if (parsed.access_token) {
        headers['Authorization'] = `Bearer ${parsed.access_token}`;
        return headers;
      }
    } catch {
      // ignore
    }
  }

  // 2. Check standard Supabase localStorage session
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item.access_token) {
          headers['Authorization'] = `Bearer ${item.access_token}`;
          return headers;
        }
      } catch {
        // ignore
      }
    }
  }

  return headers;
}

export async function scanUrl(url, environment = 'public') {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ url, environment })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Scan request failed with status ${res.status}`);
  }
  return res.json();
}

export async function analyzeCode(code, options = {}) {
  const res = await fetch('/api/analyze-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ code, ...options })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Code analysis failed with status ${res.status}`);
  }
  return res.json();
}

export async function uploadProject(file) {
  const formData = new FormData();
  formData.append('project', file);

  const res = await fetch('/api/scan/upload', {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Project upload failed.');
  }
  return res.json();
}

export async function fixProject(payload) {
  const res = await fetch('/api/fix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Fix remediation failed.');
  }
  return res.json();
}

export async function verifyScan({ url, baselineViolations }) {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ url, baselineViolations })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Verification re-scan failed.');
  }
  return res.json();
}

export async function submitReview({ reportId, fixId, action, text }) {
  const res = await fetch('/api/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ reportId, fixId, action, text })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit review.');
  }
  return res.json();
}

export async function getReport(reportId) {
  const res = await fetch(`/api/report/${reportId}`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!res.ok) {
    throw new Error(`Report not found (${res.status})`);
  }
  return res.json();
}

export async function getCertificate(certificateId) {
  const res = await fetch(`/api/certificate/${certificateId}`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!res.ok) {
    throw new Error(`Certificate not found (${res.status})`);
  }
  return res.json();
}

export async function getScansHistory() {
  const res = await fetch('/api/scans', {
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!res.ok) return { scans: [] };
  return res.json();
}

export function getAuthToken() {
  const headers = getAuthHeaders();
  if (headers['Authorization']) {
    return headers['Authorization'].replace('Bearer ', '').trim();
  }
  return null;
}

export function getPdfDownloadUrl(reportId) {
  const token = getAuthToken();
  if (token) {
    return `/api/report/${reportId}/pdf?token=${encodeURIComponent(token)}`;
  }
  return `/api/report/${reportId}/pdf`;
}

export async function downloadPdfReport(reportId, filename = null) {
  const res = await fetch(`/api/report/${reportId}/pdf`, {
    headers: {
      ...getAuthHeaders()
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename || `WCAGuard-Report-${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
}
