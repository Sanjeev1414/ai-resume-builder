import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import AuthShell from '../components/AuthShell.jsx';
import PasswordInput, { PasswordStrength } from '../components/PasswordInput.jsx';

/** /reset-password?token=... - the page the email link opens. */
export default function ResetPasswordPage() {
  useDocumentTitle('Reset password');
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { setNotice } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await resetPassword(token, password);
      setNotice('Your password has been reset. Please sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid reset link" subtitle="This link is missing its security code. Please request a new one.">
        <div className="auth-form">
          <Link to="/forgot-password" className="button button-primary button-full button-tall">Request a new link</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you haven't used before.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label className="label" htmlFor="new-password">New password</label>
          <PasswordInput id="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
                         minLength={8} autoComplete="new-password" placeholder="At least 8 characters" autoFocus />
          <PasswordStrength password={password} />
        </div>
        <div className="field">
          <label className="label" htmlFor="confirm-password">Confirm new password</label>
          <PasswordInput id="confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                         autoComplete="new-password" placeholder="Type it again" />
        </div>

        {error && <div className="banner banner-error" role="alert">{error}</div>}

        <button type="submit" className="button button-primary button-full button-tall" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Saving…' : 'Reset password'}
        </button>
        {error.includes('expired') && (
          <Link to="/forgot-password" className="button button-ghost button-full">Request a new link</Link>
        )}
      </form>
    </AuthShell>
  );
}
