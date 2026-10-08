import React, { useState } from 'react';
import PipelineStatus from '../components/PipelineStatus.jsx';

export default function Scan({
  onScanUrl,
  onAnalyzeCode,
  loading = false,
  statusMessage = ''
}) {
  const [activeTab, setActiveTab] = useState('code'); // 'url' | 'code'

  // URL Tab state (EMPTY BY DEFAULT AS SPECIFIED)
  const [url, setUrl] = useState('');
  const [environment, setEnvironment] = useState('public'); // 'public' | 'local'

  // Code Tab state (EMPTY BY DEFAULT AS SPECIFIED)
  const [code, setCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('auto'); // 'auto' | 'jsx' | 'html'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [saveCodeToHistory, setSaveCodeToHistory] = useState(false);

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onScanUrl(url.trim(), environment);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    const detectedLang = codeLanguage !== 'auto'
      ? codeLanguage
      : (code.includes('<!DOCTYPE') || code.includes('<html') || uploadedFileName.endsWith('.html'))
      ? 'html'
      : 'jsx';

    onAnalyzeCode(code, {
      saveCodeToHistory,
      language: detectedLang,
      filename: uploadedFileName || (detectedLang === 'html' ? 'index.html' : 'Component.jsx')
    });
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm');
    const isJsx = file.name.endsWith('.jsx') || file.name.endsWith('.tsx') || file.name.endsWith('.js');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCode(text);
        setUploadedFileName(file.name);
        setCodeLanguage(isHtml ? 'html' : isJsx ? 'jsx' : 'auto');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Page Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Accessibility Audit & Repair Studio
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Scan a live URL with Chromium & axe-core, or upload / paste React JSX & HTML to safely inspect and remediate WCAG violations.
        </p>
      </div>

      {/* Autonomous Repair Pipeline Stepper Tab */}
      <PipelineStatus activeStep="scan" />

      {/* Input Switch: "React & HTML code" or "URL" */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Audit Mode Selection"
          className="inline-flex p-1.5 rounded-2xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-inner gap-1"
        >
          <button
            type="button"
            role="tab"
            id="tab-code"
            aria-selected={activeTab === 'code'}
            aria-controls="panel-code"
            onClick={() => setActiveTab('code')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            React & HTML code
          </button>

          <button
            type="button"
            role="tab"
            id="tab-url"
            aria-selected={activeTab === 'url'}
            aria-controls="panel-url"
            onClick={() => setActiveTab('url')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            URL
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-700 shadow-xl">
        {/* TAB 1: SCAN WEBSITE URL */}
        {activeTab === 'url' && (
          <form
            id="panel-url"
            role="tabpanel"
            aria-labelledby="tab-url"
            onSubmit={handleUrlSubmit}
            className="space-y-6"
          >
            {/* Scan Environment Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Scan Environment Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  environment === 'public'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="environment"
                    value="public"
                    checked={environment === 'public'}
                    onChange={() => setEnvironment('public')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">Public Website</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Audits public internet domains. Localhost and private subnets are blocked.
                    </span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  environment === 'local'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                }`}>
                  <input
                    type="radio"
                    name="environment"
                    value="local"
                    checked={environment === 'local'}
                    onChange={() => setEnvironment('local')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold block">Local Development</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Allows localhost (e.g. <code>http://localhost:5173</code>) for workstation testing.
                    </span>
                  </div>
                </label>
              </div>

              {/* Local Dev Warning Notice */}
              {environment === 'local' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <span className="font-bold">Notice:</span>
                  <span>Local Development mode should only be used on your own computer.</span>
                </div>
              )}
            </div>

            {/* URL Input (EMPTY BY DEFAULT) */}
            <div className="space-y-2">
              <label htmlFor="target-url-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Target Website URL
              </label>

              <div className="relative">
                <input
                  id="target-url-input"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-400 text-sm font-mono transition-colors"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Must include http:// or https:// protocol.
              </p>
            </div>

            {/* Submit Button & Re-scan Button & Security Note */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="flex-1 w-full py-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>{statusMessage || 'Scanning Website...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Run Accessibility Scan</span>
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading || !url.trim()}
                  onClick={() => {
                    if (url.trim()) onScanUrl(url.trim(), environment);
                  }}
                  className="w-full sm:w-auto px-5 py-4 rounded-xl font-bold text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Re-scan the URL to verify your latest code changes"
                >
                  <span className={loading ? 'animate-spin inline-block' : ''}>🔄</span>
                  <span>Re-scan Updated Webpage</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Security & Sandboxing Protection:
                </span>
                <p>
                  Scans execute in a sandboxed, headless Chromium instance with strict SSRF defense. Temporary artifacts are purged automatically upon report generation.
                </p>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: ANALYZE REACT & HTML CODE */}
        {activeTab === 'code' && (
          <form
            id="panel-code"
            role="tabpanel"
            aria-labelledby="tab-code"
            onSubmit={handleCodeSubmit}
            className="space-y-6"
          >
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">🛡️</span>
                <span>Safe Static Parsing (Zero Code Execution)</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Both React JSX and HTML files are statically inspected against WCAG 2.1 AA rules and never executed in any browser or VM.
              </p>
            </div>

            {/* File Upload & Language Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80">
              {/* File Upload Button & File Name Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors shadow-xs">
                  <span>📂</span>
                  <span>Upload File (.html, .jsx, .tsx, .js)</span>
                  <input
                    type="file"
                    accept=".html,.htm,.jsx,.tsx,.js"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>

                {uploadedFileName && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold">
                    <span>✓ {uploadedFileName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFileName('');
                        setCode('');
                      }}
                      className="text-slate-400 hover:text-red-500 ml-1"
                      title="Clear uploaded file"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 select-none">
                  Format:
                </span>
                <div className="inline-flex p-0.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setCodeLanguage('auto')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      codeLanguage === 'auto'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Auto-detect
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeLanguage('jsx')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      codeLanguage === 'jsx'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    React JSX
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeLanguage('html')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      codeLanguage === 'html'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    HTML
                  </button>
                </div>
              </div>
            </div>

            {/* Code Editor Textarea with Drag & Drop */}
            <div
              className="space-y-2"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="flex justify-between items-center">
                <label htmlFor="code-input" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  {codeLanguage === 'html' ? 'Paste HTML Source Code' : codeLanguage === 'jsx' ? 'Paste React JSX Source Code' : 'Paste React JSX or HTML Code'}
                </label>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>{code ? code.split('\n').length : 0} lines</span>
                  <span>•</span>
                  <span>{code.length} chars</span>
                </div>
              </div>

              <div className={`relative rounded-2xl transition-all ${isDragging ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`}>
                <textarea
                  id="code-input"
                  required
                  rows={13}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    codeLanguage === 'html'
                      ? `<!-- Paste HTML code here or drop an .html file -->\n<!DOCTYPE html>\n<html>\n  <head><title>My App</title></head>\n  <body>\n    <img src="photo.jpg">\n  </body>\n</html>`
                      : `// Paste React component or HTML code here, or drop a file\nexport default function Component() {\n  return (\n    <div>\n      <img src="photo.jpg" />\n    </div>\n  );\n}`
                  }
                  className="w-full p-4 rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-950 text-slate-100 placeholder-slate-500 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  spellCheck="false"
                />
                {isDragging && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/80 backdrop-blur-xs rounded-2xl border-2 border-dashed border-emerald-400 text-emerald-300 font-bold text-sm pointer-events-none">
                    Drop your .html or .jsx file here to load
                  </div>
                )}
              </div>

              {/* Opt-in to save code to history */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="save-code-history-check"
                  checked={saveCodeToHistory}
                  onChange={(e) => setSaveCodeToHistory(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <label
                  htmlFor="save-code-history-check"
                  className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer"
                >
                  Save code to my history <span className="text-[11px] text-slate-500">(Never stored without explicit opt-in)</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>{statusMessage || 'Analyzing & Remediating Code...'}</span>
                  </>
                ) : (
                  <>
                    <span>Analyze and Repair Code</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  Automated Remediation Rules Supported:
                </span>
                <p>
                  Missing alt attributes (<code className="text-emerald-500">alt=""</code>), unlabelled inputs, empty buttons, document titles, root <code className="text-emerald-500">lang="en"</code>, small target sizes, and low-contrast styling are safely repaired and verifiable proof certificates issued.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
