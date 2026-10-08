import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ResetPassword({ onNavigateToLogin }) {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (pwd) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/\d/.test(pwd) && !/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return 'Password must contain at least one number or special character.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationErr = validatePassword(newPassword);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess('Your password has been successfully reset! Redirecting to login...');
      setTimeout(() => {
        if (onNavigateToLogin) onNavigateToLogin();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to update password. Your reset link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-6 bg-[#EFEFEE]">
      <div
        className="w-full max-w-md bg-white rounded-[16px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-200/80 p-8 space-y-6"
        style={{ fontFamily: "'Poppins', system-ui, -apple-system, sans-serif" }}
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto text-xl shadow-xs">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Please enter and confirm your new secure password.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-xs font-bold text-slate-800 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] pl-3.5 pr-10 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 rounded"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-800 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              required
              className="w-full bg-[#EDEDF2] text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-[8px] px-3.5 py-2.5 border border-transparent focus:border-slate-400 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className="font-semibold text-slate-700 block">Security Requirements:</span>
            <ul className="list-disc pl-4 space-y-0.5">
              <li className={newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>
                At least 8 characters
              </li>
              <li className={/\d/.test(newPassword) || /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'text-emerald-600 font-semibold' : ''}>
                Contains a number or special character
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(success)}
            className="w-full bg-[#111] hover:bg-black text-white font-semibold text-xs sm:text-sm rounded-[8px] py-2.5 sm:py-3 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
