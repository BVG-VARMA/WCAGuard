import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  resendConfirmationEmail,
  resetPasswordForEmail,
  updateUserPassword,
  signOutUser
} from '../api/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      // Check local session first
      const mockRaw =
        localStorage.getItem('wcaguard_mock_session') ||
        sessionStorage.getItem('wcaguard_mock_session');
      if (mockRaw) {
        try {
          const parsed = JSON.parse(mockRaw);
          if (mounted && parsed?.user) {
            setSession(parsed);
            setUser(parsed.user);
            setLoading(false);
            return;
          }
        } catch {
          // ignore parse error
        }
      }

      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      // Supabase live session
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        // Only accept session if email is confirmed
        if (data.session?.user?.email_confirmed_at || data.session?.user?.confirmed_at) {
          setSession(data.session);
          setUser(data.session?.user || null);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }

      // Listen to auth events
      const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (mounted) {
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
          } else if (currentSession?.user?.email_confirmed_at || currentSession?.user?.confirmed_at) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
          setLoading(false);
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async ({ email, password, rememberMe = true }) => {
    setLoading(true);
    try {
      const res = await signInWithEmail({ email, password, rememberMe });
      if (res.error) throw res.error;
      setUser(res.data.user);
      setSession(res.data.session);
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const res = await signUpWithEmail({ name, email, password });
      if (res.error) throw res.error;
      // Do NOT set active session on signup — email confirmation link is required
      return res.data;
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email) => {
    const res = await resendConfirmationEmail(email);
    if (res.error) throw res.error;
    return res.data;
  };

  const resetPassword = async (email) => {
    const res = await resetPasswordForEmail(email);
    if (res.error) throw res.error;
    return res.data;
  };

  const updatePassword = async (newPassword) => {
    const res = await updateUserPassword(newPassword);
    if (res.error) throw res.error;
    return res.data;
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    token: session?.access_token || null,
    isAuthenticated: Boolean(user),
    loading,
    login,
    signup,
    resendVerification,
    resetPassword,
    updatePassword,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * ProtectedRoute component ensuring scan and report pages require authentication
 */
export function ProtectedRoute({ children, onRedirectToAuth }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
          🔒
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Please log in or create an account to access the WCAG accessibility scanner, auto-repair engine, and cryptographic audit proofs.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={onRedirectToAuth}
            className="px-6 py-2.5 rounded-[8px] bg-[#111] hover:bg-black text-white text-xs font-semibold shadow-md transition-all transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-black"
          >
            Go to Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return children;
}
