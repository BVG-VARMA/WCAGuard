import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Scan from './pages/Scan.jsx';
import Results from './pages/Results.jsx';
import Report from './pages/Report.jsx';
import PitchDeck from './pages/PitchDeck.jsx';
import Auth from './pages/Auth.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import History from './pages/History.jsx';
import WcagCoverageTable from './components/WcagCoverageTable.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import { useScan } from './hooks/useScan.js';
import { useAuth, ProtectedRoute } from './hooks/useAuth.jsx';
import { recordScanToDatabase } from './api/supabase.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing' | 'scan' | 'results' | 'report' | 'deck' | 'coverage' | 'auth' | 'history' | 'reset-password'
  const [darkMode, setDarkMode] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const {
    user,
    isAuthenticated,
    login,
    signup,
    resendVerification,
    resetPassword,
    logout,
    loading: authLoading
  } = useAuth();

  const {
    loading,
    statusMessage,
    error,
    setError,
    scanResult,
    fixResult,
    handleScan,
    handleAnalyzeCode,
    handleFix,
    handleReview
  } = useScan();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle URL detection for email verification and password reset recovery
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const path = window.location.pathname || '';

    if (hash.includes('type=recovery') || search.includes('type=recovery') || path === '/reset-password') {
      setCurrentPage('reset-password');
    } else if (search.includes('verified=true')) {
      setCurrentPage('auth');
      setAuthSuccess('✓ Email verified successfully! You can now log in with your credentials.');
    }
  }, []);

  const onScanUrlSubmit = async (url, environment) => {
    setCurrentUrl(url);
    try {
      const data = await handleScan(url, environment);
      setCurrentPage('results');

      // Record to user's database history if authenticated
      if (user?.id) {
        try {
          await recordScanToDatabase({
            userId: user.id,
            inputType: 'url',
            targetUrl: url,
            codeHash: null,
            savedCode: null,
            violations: data.violations || [],
            certificates: data.certificates || []
          });
        } catch {
          // ignore background save error
        }
      }
    } catch {
      // Error handled in hook
    }
  };

  const onAnalyzeCodeSubmit = async (code, options = {}) => {
    setCurrentUrl(options.language === 'html' ? 'HTML Source Code' : 'React JSX Source Code');
    try {
      const data = await handleAnalyzeCode(code, options);
      setCurrentPage('results');

      // Record to user's database history if authenticated
      // (Never stores raw pasted code unless the user explicitly ticked "Save code to my history")
      if (user?.id) {
        try {
          await recordScanToDatabase({
            userId: user.id,
            inputType: 'code',
            targetUrl: null,
            codeHash: data.scanId || 'sha256-code',
            savedCode: options.saveCodeToHistory ? code : null,
            violations: data.violations || [],
            certificates: data.certificates || []
          });
        } catch {
          // ignore background save error
        }
      }
    } catch {
      // Error handled in hook
    }
  };

  const onApplyFixRemediation = async () => {
    try {
      await handleFix(currentUrl);
      setCurrentPage('report');
    } catch {
      // Error in hook
    }
  };

  // Auth actions
  const handleAuthLogin = async (creds) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      await login(creds);
      setAuthSuccess('Welcome back! Successfully logged in.');
      setCurrentPage('scan');
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleAuthSignUp = async (data) => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await signup(data);
      // Keep on Auth page: User must confirm email before logging in
      setAuthSuccess(`Account created! A confirmation email has been sent to ${data.email}. Please verify your email before logging in.`);
      setCurrentPage('auth');
      return res;
    } catch (err) {
      setAuthError(err.message || 'Sign up failed.');
      throw err;
    }
  };

  const handleAuthResetPassword = async (email) => {
    setAuthError('');
    try {
      const res = await resetPassword(email);
      setAuthSuccess(res?.message || 'If an account exists for this email, a password reset link has been sent.');
    } catch {
      setAuthSuccess('If an account exists for this email, a password reset link has been sent.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Skip to Main Content Link for Keyboard Accessibility (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-700 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Primary Header */}
      <header className="bg-[#0B192C] text-white shadow-md sticky top-0 z-50 border-b border-blue-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setCurrentPage('landing')}
            role="button"
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setCurrentPage('landing');
            }}
            aria-label="WCAGuard Home"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/60 flex items-center justify-center border border-blue-400/40 text-emerald-400 font-bold text-lg shadow-sm">
              🛡️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white">WCAGuard</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-400/40 font-bold">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Find it. Fix it. Prove it.</p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => setCurrentPage('landing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                currentPage === 'landing'
                  ? 'bg-blue-800 text-white shadow-inner'
                  : 'text-blue-100 hover:bg-blue-900/60'
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('scan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                currentPage === 'scan'
                  ? 'bg-blue-800 text-white shadow-inner'
                  : 'text-blue-100 hover:bg-blue-900/60'
              }`}
            >
              Scan & Audit
            </button>

            {scanResult && (
              <button
                type="button"
                onClick={() => setCurrentPage('results')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  currentPage === 'results'
                    ? 'bg-blue-800 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-blue-900/60'
                }`}
              >
                Results ({scanResult.violations?.length || scanResult.totalViolations || 0})
              </button>
            )}

            {(fixResult || scanResult?.certificates?.length > 0) && (
              <button
                type="button"
                onClick={() => setCurrentPage('report')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  currentPage === 'report'
                    ? 'bg-blue-800 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-blue-900/60'
                }`}
              >
                Proof & Certificates
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentPage('deck')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                currentPage === 'deck'
                  ? 'bg-emerald-700 text-white shadow-inner'
                  : 'text-emerald-300 hover:bg-blue-900/60'
              }`}
            >
              <span>📊</span>
              <span>Pitch Deck</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPage('coverage')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold hidden md:inline-flex items-center transition-colors ${
                currentPage === 'coverage'
                  ? 'bg-blue-800 text-white shadow-inner'
                  : 'text-blue-100 hover:bg-blue-900/60'
              }`}
            >
              Scope
            </button>

            {/* History Tab */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setCurrentPage('history')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                  currentPage === 'history'
                    ? 'bg-blue-800 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-blue-900/60'
                }`}
              >
                <span>📜</span>
                <span>History</span>
              </button>
            )}

            {/* User Profile / Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1">
                <span className="text-[11px] font-semibold text-emerald-300 hidden lg:inline-block max-w-[120px] truncate">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setCurrentPage('landing');
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-red-500/80 text-white border border-white/20 transition-all cursor-pointer"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentPage('auth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentPage === 'auth'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <span>👤</span>
                <span>Sign In</span>
              </button>
            )}

            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-900 dark:text-red-200 text-xs flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-red-600 select-none">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="font-bold text-red-700 dark:text-red-300 hover:underline px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. LANDING PAGE */}
        {currentPage === 'landing' && (
          <Landing
            onNavigateToScan={() => setCurrentPage('scan')}
            onNavigateToCode={() => setCurrentPage('scan')}
            onNavigateToDeck={() => setCurrentPage('deck')}
          />
        )}

        {/* 2. SCAN PAGE (PROTECTED ROUTE: REQUIRES AUTHENTICATION) */}
        {currentPage === 'scan' && (
          <ProtectedRoute onRedirectToAuth={() => setCurrentPage('auth')}>
            <Scan
              onScanUrl={onScanUrlSubmit}
              onAnalyzeCode={onAnalyzeCodeSubmit}
              loading={loading}
              statusMessage={statusMessage}
            />
          </ProtectedRoute>
        )}

        {/* 3. RESULTS DASHBOARD */}
        {currentPage === 'results' && (
          <Results
            scanResult={scanResult}
            onApplyAllFixes={onApplyFixRemediation}
            onApplySingleFix={(ruleId) => handleFix(currentUrl)}
            onNavigateToReport={() => setCurrentPage('report')}
            onRecheckCode={handleAnalyzeCode}
            onRescanUrl={(targetUrl) => onScanUrlSubmit(targetUrl || currentUrl, scanResult?.environment || 'local')}
            rescanning={loading}
            fixing={loading}
            fixStatusMessage={statusMessage}
          />
        )}

        {/* 4. CERTIFICATES AND REPORTS PAGE */}
        {currentPage === 'report' && (
          <Report
            fixResult={fixResult || scanResult}
            onReviewAction={handleReview}
          />
        )}

        {/* 5. HISTORY PAGE (PROTECTED ROUTE) */}
        {currentPage === 'history' && (
          <ProtectedRoute onRedirectToAuth={() => setCurrentPage('auth')}>
            <History
              onNavigateToScan={() => setCurrentPage('scan')}
              onSelectReport={(scan) => {
                if (scan.scanId || scan.id) {
                  setCurrentPage('report');
                }
              }}
            />
          </ProtectedRoute>
        )}

        {/* 6. PITCH DECK PAGE */}
        {currentPage === 'deck' && (
          <PitchDeck />
        )}

        {/* 7. WCAG SCOPE & CRITERIA COVERAGE */}
        {currentPage === 'coverage' && (
          <WcagCoverageTable />
        )}

        {/* 8. AUTHENTICATION (LOGIN / SIGN UP: EMAIL & PASSWORD ONLY) */}
        {currentPage === 'auth' && (
          <Auth
            onLogin={handleAuthLogin}
            onSignUp={handleAuthSignUp}
            onResetPassword={handleAuthResetPassword}
            authLoading={authLoading}
            authError={authError}
            authSuccess={authSuccess}
            onClearMessage={() => {
              setAuthError('');
              setAuthSuccess('');
            }}
          />
        )}

        {/* 9. RESET PASSWORD PAGE */}
        {currentPage === 'reset-password' && (
          <ResetPassword
            onNavigateToLogin={() => {
              setAuthSuccess('Please log in with your updated password.');
              setCurrentPage('auth');
            }}
          />
        )}
      </main>

      {/* Mandatory Accessible Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-xs text-slate-600 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              WCAGuard • Find it. Fix it. Prove it.
            </span>
            <p className="text-[11px] text-slate-500">
              Engineered with Playwright, axe-core, Babel AST, Express & React.
            </p>
          </div>

          <div className="text-[11px] text-slate-500 max-w-lg leading-relaxed">
            WCAGuard supports accessibility improvement but does not replace human accessibility expertise.
          </div>
        </div>
      </footer>
    </div>
  );
}
