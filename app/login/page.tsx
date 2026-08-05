'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const COLLEGE_DOMAIN = process.env.NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN || '';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function domainOk(addr: string) {
    if (!COLLEGE_DOMAIN) return true;
    return addr.trim().toLowerCase().endsWith('@' + COLLEGE_DOMAIN.toLowerCase());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!domainOk(email)) {
      setError(`Please use your college email (must end with @${COLLEGE_DOMAIN}).`);
      return;
    }

    setBusy(true);
    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setBusy(false);
      if (signUpError) { setError(signUpError.message); return; }
      setSuccess('Account created. Check your email to confirm, then sign in.');
      setMode('signin');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (signInError) { setError(signInError.message); return; }
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="sem-panel form-card" style={{ marginTop: 30 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>
        {mode === 'signin' ? 'Sign in' : 'Create an account'}
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: -8 }}>
        {COLLEGE_DOMAIN ? `Only @${COLLEGE_DOMAIN} emails can join` : 'PaperVault'}
      </p>

      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 8 }}>
        {mode === 'signup' && (
          <div className="form-group full">
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        )}
        <div className="form-group full">
          <label>College email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={COLLEGE_DOMAIN ? `you@${COLLEGE_DOMAIN}` : 'you@example.com'}
            required
          />
        </div>
        <div className="form-group full">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="form-group full" style={{ marginTop: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </form>

      <p style={{ fontSize: 13, marginTop: 16 }}>
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <a
          style={{ color: 'var(--ink)', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
        >
          {mode === 'signin' ? 'Sign up' : 'Sign in'}
        </a>
      </p>
    </div>
  );
}
