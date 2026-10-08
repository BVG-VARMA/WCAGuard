import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key';

export const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');

// Custom storage provider support for "Remember me" functionality
const customStorage = {
  getItem: (key) => {
    const remember = localStorage.getItem('wcaguard_remember_me') !== 'false';
    return remember ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    const remember = localStorage.getItem('wcaguard_remember_me') !== 'false';
    if (remember) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * Sign up with email and password
 * Enforces email confirmation link delivery before allowing login
 */
export async function signUpWithEmail({ email, password, name }) {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    // Local development mode: store in mock registered users database
    const users = JSON.parse(localStorage.getItem('wcaguard_auth_users') || '{}');
    if (users[cleanEmail]) {
      return {
        data: null,
        error: { message: 'An account with this email already exists. Please log in.' }
      };
    }

    users[cleanEmail] = {
      id: 'usr-' + Date.now(),
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split('@')[0],
      password,
      verified: false, // Must be verified before login
      created_at: new Date().toISOString()
    };
    localStorage.setItem('wcaguard_auth_users', JSON.stringify(users));

    return {
      data: {
        user: { email: cleanEmail },
        session: null,
        requireVerification: true,
        email: cleanEmail
      },
      error: null
    };
  }

  // Live Supabase Auth signUp
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { name: name?.trim() || cleanEmail.split('@')[0] },
      emailRedirectTo: `${window.location.origin}/auth?verified=true`
    }
  });

  if (error) return { data: null, error };

  // If user already registered and email confirmed
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    return {
      data: null,
      error: { message: 'An account with this email already exists. Please log in.' }
    };
  }

  return {
    data: {
      user: data.user,
      session: null,
      requireVerification: true,
      email: cleanEmail
    },
    error: null
  };
}

/**
 * Sign in with email and password only.
 * - Does NOT create user automatically.
 * - If user does not exist: shows "No account exists with this email. Please sign up."
 * - If password incorrect: shows "Incorrect password. Please try again."
 * - Blocks unverified email accounts.
 */
export async function signInWithEmail({ email, password, rememberMe = true }) {
  localStorage.setItem('wcaguard_remember_me', rememberMe ? 'true' : 'false');
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    const users = JSON.parse(localStorage.getItem('wcaguard_auth_users') || '{}');
    const existing = users[cleanEmail];

    if (!existing) {
      return {
        data: null,
        error: { message: 'No account exists with this email. Please sign up.', code: 'user_not_found' }
      };
    }

    if (existing.password !== password) {
      return {
        data: null,
        error: { message: 'Incorrect password. Please try again.', code: 'invalid_password' }
      };
    }

    if (!existing.verified) {
      return {
        data: null,
        error: {
          message: 'Your email has not been verified yet. Please check your inbox and verify your email before logging in.',
          code: 'email_not_confirmed',
          email: cleanEmail
        }
      };
    }

    const mockUser = {
      id: existing.id,
      email: cleanEmail,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { name: existing.name }
    };
    const mockSession = {
      access_token: 'mock-jwt-token-' + btoa(cleanEmail),
      user: mockUser
    };

    if (rememberMe) {
      localStorage.setItem('wcaguard_mock_session', JSON.stringify(mockSession));
    } else {
      sessionStorage.setItem('wcaguard_mock_session', JSON.stringify(mockSession));
    }

    return { data: { user: mockUser, session: mockSession }, error: null };
  }

  // 1. Fast path for demo accounts: demo@wcaguard.com
  if (cleanEmail === 'demo@wcaguard.com' && (password === 'Demo123!' || password === 'demo123' || password === 'password123')) {
    const mockUser = {
      id: 'demo-user-12345',
      email: cleanEmail,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { name: 'Auditor' }
    };
    const mockSession = {
      access_token: 'mock-jwt-token-' + btoa(cleanEmail),
      user: mockUser
    };
    localStorage.setItem('wcaguard_mock_session', JSON.stringify(mockSession));
    return { data: { user: mockUser, session: mockSession }, error: null };
  }

  // 2. Live Supabase login attempt
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password
  });

  if (error) {
    const errMsg = (error.message || '').toLowerCase();

    // Check if email confirmation is missing
    if (errMsg.includes('email not confirmed') || error.code === 'email_not_confirmed') {
      return {
        data: null,
        error: {
          message: 'Your email has not been verified yet. Please check your inbox and verify your email before logging in.',
          code: 'email_not_confirmed',
          email: cleanEmail
        }
      };
    }

    // Check if user exists in database to distinguish between wrong password vs non-existent user
    let userExists = true;
    try {
      const { data: exists, error: rpcErr } = await supabase.rpc('check_user_exists', {
        lookup_email: cleanEmail
      });
      if (!rpcErr && typeof exists === 'boolean') {
        userExists = exists;
      }
    } catch {
      // ignore rpc failure and fall back
    }

    if (!userExists) {
      return {
        data: null,
        error: {
          message: 'No account exists with this email. Please sign up.',
          code: 'user_not_found'
        }
      };
    }

    return {
      data: null,
      error: {
        message: 'Incorrect password. Please try again.',
        code: 'invalid_password'
      }
    };
  }

  // 2. Extra verification check on user object
  if (data?.user && !data.user.email_confirmed_at && !data.user.confirmed_at) {
    await supabase.auth.signOut();
    return {
      data: null,
      error: {
        message: 'Your email has not been verified yet. Please check your inbox and verify your email before logging in.',
        code: 'email_not_confirmed',
        email: cleanEmail
      }
    };
  }

  return { data, error: null };
}

/**
 * Resend email confirmation link for unverified user
 */
export async function resendConfirmationEmail(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    // In dev mode simulate confirmation email
    return { data: { success: true, email: cleanEmail }, error: null };
  }

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/auth?verified=true`
    }
  });

  return { data, error };
}

/**
 * Manually confirm email in dev / mock mode
 */
export function verifyMockUserEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  const users = JSON.parse(localStorage.getItem('wcaguard_auth_users') || '{}');
  if (users[cleanEmail]) {
    users[cleanEmail].verified = true;
    localStorage.setItem('wcaguard_auth_users', JSON.stringify(users));
    return true;
  }
  return false;
}

/**
 * Reset password email trigger
 * Displays identical neutral confirmation message whether or not email exists
 */
export async function resetPasswordForEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  const neutralMessage = 'If an account exists for this email, a password reset link has been sent.';

  if (!isSupabaseConfigured) {
    return { data: { message: neutralMessage }, error: null };
  }

  try {
    await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  } catch {
    // Intentionally catch and return neutral message to prevent user enumeration
  }

  return { data: { message: neutralMessage }, error: null };
}

/**
 * Update authenticated user's password (used on reset-password page)
 */
export async function updateUserPassword(newPassword) {
  if (!isSupabaseConfigured) {
    // Mock update: update currently active mock session password
    const raw = localStorage.getItem('wcaguard_mock_session') || sessionStorage.getItem('wcaguard_mock_session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const email = parsed.user?.email;
        if (email) {
          const users = JSON.parse(localStorage.getItem('wcaguard_auth_users') || '{}');
          if (users[email]) {
            users[email].password = newPassword;
            localStorage.setItem('wcaguard_auth_users', JSON.stringify(users));
          }
        }
      } catch {
        // ignore
      }
    }
    return { data: { success: true }, error: null };
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  return { data, error };
}

/**
 * Sign out
 */
export async function signOutUser() {
  localStorage.removeItem('wcaguard_mock_session');
  sessionStorage.removeItem('wcaguard_mock_session');

  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

/**
 * Fetch past scans for authenticated user
 */
export async function fetchUserScans(userId) {
  if (!isSupabaseConfigured) {
    const stored = localStorage.getItem('wcaguard_mock_scans');
    return stored ? JSON.parse(stored) : [];
  }

  const { data, error } = await supabase
    .from('scans')
    .select('*, scan_issues(*), certificates(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Save scan and issue records with RLS
 */
export async function recordScanToDatabase({
  userId,
  inputType,
  targetUrl,
  codeHash,
  savedCode = null,
  status = 'completed',
  violations = [],
  certificates = []
}) {
  if (!isSupabaseConfigured) {
    const mockScan = {
      id: 'scan-' + Date.now(),
      user_id: userId,
      input_type: inputType,
      target_url: targetUrl,
      code_hash: codeHash,
      saved_code: savedCode,
      status,
      created_at: new Date().toISOString(),
      scan_issues: (violations || []).map((v, i) => ({
        id: `issue-${i}-${Date.now()}`,
        rule_id: v.id || v.ruleId || 'rule',
        wcag_criterion: v.help || v.wcagCriterion || 'WCAG Criterion',
        impact: v.impact || 'moderate',
        message: v.description || v.message || 'Issue detected',
        classification: v.classification || 'Needs review',
        status: 'detected'
      })),
      certificates: (certificates || []).map((c, i) => ({
        id: c.certificateId || `cert-${i}-${Date.now()}`,
        sha256: c.witnesses?.postHash || codeHash || 'sha256-mock',
        status_summary: c.status || 'CERTIFIED',
        pdf_path: c.pdfPath || null,
        created_at: new Date().toISOString()
      }))
    };

    const existing = JSON.parse(localStorage.getItem('wcaguard_mock_scans') || '[]');
    localStorage.setItem('wcaguard_mock_scans', JSON.stringify([mockScan, ...existing]));
    return mockScan;
  }

  // 1. Insert Scan
  const { data: scan, error: scanErr } = await supabase
    .from('scans')
    .insert([
      {
        user_id: userId,
        input_type: inputType,
        target_url: targetUrl,
        code_hash: codeHash,
        saved_code: savedCode,
        status
      }
    ])
    .select()
    .single();

  if (scanErr) throw scanErr;

  // 2. Insert Issues
  if (violations && violations.length > 0) {
    const issueRows = violations.map((v) => ({
      scan_id: scan.id,
      rule_id: v.id || v.ruleId,
      wcag_criterion: v.help || v.wcagCriterion || 'WCAG',
      impact: v.impact || 'moderate',
      selector_or_line: v.nodes?.[0]?.target?.[0] || v.selector || (v.line ? `Line ${v.line}` : ''),
      message: v.description || v.message || 'WCAG violation',
      classification: v.classification || 'Needs review',
      status: 'detected'
    }));

    await supabase.from('scan_issues').insert(issueRows);
  }

  // 3. Insert Certificates
  if (certificates && certificates.length > 0) {
    const certRows = certificates.map((c) => ({
      scan_id: scan.id,
      user_id: userId,
      sha256: c.witnesses?.postHash || codeHash || 'sha256',
      status_summary: c.status || 'CERTIFIED',
      pdf_path: c.pdfPath || null
    }));

    await supabase.from('certificates').insert(certRows);
  }

  return scan;
}
