import React, { useState } from 'react';
import { resendConfirmationEmail, verifyMockUserEmail, isSupabaseConfigured } from '../api/supabase.js';

/**
 * Secure Supabase-Only Authentication Component
 * - Email and password login ONLY (no Google, no social logins, no SSO)
 * - Strict verification enforcement: unverified accounts are blocked from login
 * - Helpful error messaging: user does not exist vs incorrect password
 * - Resend verification link functionality
 * - Forgot password with neutral response
 */
export default function Auth({
  onLogin,
  onSignUp,
  onResetPassword,
  defaultMode = 'login',
  authLoading = false,
  authError = '',
  authSuccess = '',
  onClearMessage
}) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpClientError, setSignUpClientError] = useState('');

  // Unverified email banner state
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  // Signup verification pending state
  const [signupPendingEmail, setSignupPendingEmail] = useState('');

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // Validate password strength
  const validatePasswordStrength = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/\d/.test(pwd) && !/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one number or special character.';
    }
    return null;
  };

  // Handle Login submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setUnverifiedEmail('');
    setResendStatus('');
    if (onClearMessage) onClearMessage();

    if (!loginEmail.trim() || !loginPassword) {
      return;
    }

    if (onLogin) {
      try {
        await onLogin({ email: loginEmail.trim(), password: loginPassword, rememberMe });
      } catch (err) {
        if (err.code === 'email_not_confirmed' || (err.message && err.message.toLowerCase().includes('not verified'))) {
          setUnverifiedEmail(err.email || loginEmail.trim());
        }
      }
    }
  };

  // Handle Sign Up submission
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setSignUpClientError('');
    if (onClearMessage) onClearMessage();

    if (!signUpEmail.trim() || !signUpPassword) {
      setSignUpClientError('Please fill in all required fields.');
      return;
    }

    const pwdErr = validatePasswordStrength(signUpPassword);
    if (pwdErr) {
      setSignUpClientError(pwdErr);
      return;
    }

    if (onSignUp) {
      try {
        const result = await onSignUp({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          password: signUpPassword
        });

        if (result?.requireVerification || !result?.session) {
          setSignupPendingEmail(signUpEmail.trim());
          setIsSignUp(false); // Switch to login view with verification notice
        }
      } catch (err) {
        setSignUpClientError(err.message || 'Failed to register account.');
      }
    }
  };

  // Handle resend verification link
  const handleResendVerification = async (targetEmail) => {
    const emailToUse = targetEmail || unverifiedEmail || loginEmail;
    if (!emailToUse) return;

    setResending(true);
    setResendStatus('');
    try {
      await resendConfirmationEmail(emailToUse);
      setResendStatus(`Verification link sent to ${emailToUse}. Please check your inbox.`);
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  // Helper for mock mode testing in dev
  const handleSimulateVerify = (targetEmail) => {
    const emailToUse = targetEmail || unverifiedEmail || loginEmail;
    if (emailToUse) {
      verifyMockUserEmail(emailToUse);
      setUnverifiedEmail('');
      setSignupPendingEmail('');
      setResendStatus(`✓ Email ${emailToUse} verified! You can now log in.`);
    }
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotLoading(true);
    setForgotStatus('');
    try {
      if (onResetPassword) {
        await onResetPassword(forgotEmail.trim());
      }
      // Neutral message as required by specifications
      setForgotStatus('If an account exists for this email, a password reset link has been sent.');
    } catch {
      setForgotStatus('If an account exists for this email, a password reset link has been sent.');
    } finally {
      setForgotLoading(false);
    }
  };

  const toggleMode = () => {
    if (onClearMessage) onClearMessage();
    setSignUpClientError('');
    setUnverifiedEmail('');
    setResendStatus('');
    setIsSignUp((prev) => !prev);
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 bg-[#EFEFEE]">
      {/* Centered Card (900x560 on desktop) */}
      <div
        className="relative w-full max-w-[900px] min-h-[560px] md:h-[560px] bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-200/70 overflow-hidden flex flex-col md:block"
        style={{ fontFamily: "'Poppins', system-ui, -apple-system, sans-serif" }}
      >
        {/* ARIA-LIVE REGION FOR ACCESSIBILITY */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {authError}
          {authSuccess}
          {forgotStatus}
          {signUpClientError}
        </div>

        {/* ---------------- MOBILE BANNER (<700px) ---------------- */}
        <div
          className="md:hidden relative w-full h-[180px] text-white p-6 flex flex-col justify-center items-center text-center overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(8, 12, 22, 0.45) 0%, rgba(6, 9, 16, 0.8) 60%, #06080d 100%), url('/dark-mountains.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%'
          }}
        >
          <div className="relative z-10 space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Welcome back' : 'Hello there'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xs">
              {isSignUp
                ? 'Log in with your verified email and password.'
                : 'Create an account and verify your email to get started.'}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              className="mt-2 inline-flex items-center justify-center px-4 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 border border-white/60 text-xs font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
            >
              {isSignUp ? 'Switch to Login' : 'Switch to Sign Up'}
            </button>
          </div>
        </div>

        {/* ---------------- DESKTOP SLIDING OVERLAY (700px and up) ---------------- */}
        <div
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full z-20 text-white flex-col justify-center items-center text-center p-10 overflow-hidden transition-transform duration-[600ms] ease-in-out select-none ${
            isSignUp ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(10, 16, 26, 0.35) 0%, rgba(8, 12, 20, 0.75) 55%, #05070c 100%), url('/dark-mountains.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%'
          }}
        >
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />

          {/* Overlay Content State A (Prompt to Sign Up) */}
          <div
            className={`relative z-10 transition-opacity duration-300 max-w-xs space-y-4 ${
              !isSignUp ? 'opacity-100 pointer-events-auto block' : 'opacity-0 pointer-events-none hidden'
            }`}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              Hello there
            </h2>
            <p className="text-xs leading-relaxed text-slate-200/90 font-normal">
              Register with your email to inspect, remediate, and certify WCAG accessibility compliance.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="w-40 py-2.5 rounded-[8px] bg-[#111] hover:bg-black text-white text-xs font-semibold border border-white/40 shadow-lg hover:border-white transition-all transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Overlay Content State B (Prompt to Login) */}
          <div
            className={`relative z-10 transition-opacity duration-300 max-w-xs space-y-4 ${
              isSignUp ? 'opacity-100 pointer-events-auto block' : 'opacity-0 pointer-events-none hidden'
            }`}
          >
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              Welcome back
            </h2>
            <p className="text-xs leading-relaxed text-slate-200/90 font-normal">
              Log in with your existing verified credentials to continue your audits.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="w-40 py-2.5 rounded-[8px] bg-[#111] hover:bg-black text-white text-xs font-semibold border border-white/40 shadow-lg hover:border-white transition-all transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </div>

        {/* ---------------- LOGIN FORM CONTAINER (LEFT HALF on desktop) ---------------- */}
        <div
          className={`w-full md:w-1/2 md:absolute md:top-0 md:left-0 md:h-full flex flex-col justify-center px-8 sm:px-12 py-8 transition-opacity duration-300 bg-white ${
            !isSignUp ? 'opacity-100 pointer-events-auto z-10' : 'md:opacity-0 md:pointer-events-none z-0 hidden md:flex'
          }`}
        >
          <div className="max-w-[340px] w-full mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Login
            </h1>

            {/* Verification Pending Banner after Sign Up */}
            {signupPendingEmail && (
              <div
                role="status"
                className="mb-4 p-3 rounded-[8px] bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1.5 leading-relaxed"
              >
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <span>✉️</span>
                  <span>Check Your Inbox</span>
                </div>
                <p>
                  A confirmation link has been sent to <strong>{signupPendingEmail}</strong>. Please verify your email before logging in.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResendVerification(signupPendingEmail)}
                    disabled={resending}
                    className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    {resending ? 'Sending...' : 'Resend link'}
                  </button>
                  {!isSupabaseConfigured && (
                    <button
                      type="button"
                      onClick={() => handleSimulateVerify(signupPendingEmail)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      ⚡ Verify now (Dev Mode)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Unverified Account Warning during Login */}
            {unverifiedEmail && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-[8px] bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5 leading-relaxed"
              >
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <span>⚠️</span>
                  <span>Email Not Verified</span>
                </div>
                <p>
                  Your email address (<strong>{unverifiedEmail}</strong>) has not been confirmed yet. Please verify your email before logging in.
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResendVerification(unverifiedEmail)}
                    disabled={resending}
                    className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                  >
                    {resending ? 'Sending...' : 'Resend verification email'}
                  </button>
                  {!isSupabaseConfigured && (
                    <button
                      type="button"
                      onClick={() => handleSimulateVerify(unverifiedEmail)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      ⚡ Verify now (Dev Mode)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* General Auth Error Banner */}
            {authError && !unverifiedEmail && !signupPendingEmail && (
              <div
                role="alert"
                className="mb-4 p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs font-medium"
              >
                {authError}
              </div>
            )}

            {/* General Auth Success Banner */}
            {authSuccess && (
              <div
                role="status"
                className="mb-4 p-2.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
              >
                {authSuccess}
              </div>
            )}

            {/* Resend Status Banner */}
            {resendStatus && (
              <div
                role="status"
                className="mb-4 p-2 rounded-[8px] bg-teal-50 border border-teal-200 text-[#0f766e] text-[11px] font-medium"
              >
                {resendStatus}
              </div>
            )}

            {/* EMAIL AND PASSWORD ONLY LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <div className="mb-1">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-slate-800"
                  >
                    Email
                  </label>
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="alex@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] px-3.5 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] pl-3.5 pr-10 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 rounded focus-visible:ring-2 focus-visible:ring-slate-800 cursor-pointer"
                  >
                    {showLoginPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                  <input
                    type="checkbox"
                    id="login-remember"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-black focus:ring-black accent-black"
                  />
                  <span className="font-medium text-slate-700">Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(true);
                    setForgotStatus('');
                    setForgotEmail(loginEmail || '');
                  }}
                  className="text-xs font-semibold text-[#0d9488] hover:text-[#0f766e] hover:underline focus-visible:ring-2 focus-visible:ring-[#0d9488] rounded px-1 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#111] hover:bg-black active:bg-neutral-900 text-white font-semibold text-xs sm:text-sm rounded-[8px] py-2.5 sm:py-3 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
              >
                {authLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>

        {/* ---------------- SIGN UP FORM CONTAINER (RIGHT HALF on desktop) ---------------- */}
        <div
          className={`w-full md:w-1/2 md:absolute md:top-0 md:left-1/2 md:h-full flex flex-col justify-center px-8 sm:px-12 py-8 transition-opacity duration-300 bg-white ${
            isSignUp ? 'opacity-100 pointer-events-auto z-10' : 'md:opacity-0 md:pointer-events-none z-0 hidden md:flex'
          }`}
        >
          <div className="max-w-[340px] w-full mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-4">
              Sign Up
            </h1>

            {/* Error Banners */}
            {(signUpClientError || (authError && isSignUp)) && (
              <div
                role="alert"
                className="mb-4 p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-xs font-medium"
              >
                {signUpClientError || authError}
              </div>
            )}

            {/* EMAIL AND PASSWORD ONLY SIGN UP FORM */}
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5" noValidate>
              {/* Name */}
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Alex Morgan"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  autoComplete="name"
                  className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] px-3.5 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="alex@example.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] px-3.5 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Password (8+ chars)
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showSignUpPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] pl-3.5 pr-10 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword((prev) => !prev)}
                    aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 rounded focus-visible:ring-2 focus-visible:ring-slate-800 cursor-pointer"
                  >
                    {showSignUpPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Must be at least 8 characters with numbers or special symbols.
                </p>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#111] hover:bg-black active:bg-neutral-900 text-white font-semibold text-xs sm:text-sm rounded-[8px] py-2.5 sm:py-3 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
              >
                {authLoading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ---------------- FORGOT PASSWORD ACCESSIBLE MODAL ---------------- */}
      {isForgotOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-white rounded-[16px] max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="forgot-modal-title" className="text-lg font-bold text-slate-900">
                Reset Password
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setForgotStatus('');
                }}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-slate-700 text-lg p-1 rounded focus-visible:ring-2 focus-visible:ring-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered email address. We will send a secure password recovery link to your inbox.
            </p>

            {forgotStatus && (
              <div
                role="status"
                className="p-3 rounded-[8px] bg-teal-50 border border-teal-200 text-[#0f766e] text-xs font-semibold leading-relaxed"
              >
                {forgotStatus}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] px-3.5 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotStatus('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-[8px] transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#111] hover:bg-black rounded-[8px] transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-black cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
