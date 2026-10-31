import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api.js';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import AuthShell from '../components/AuthShell.jsx';
import { ArrowLeftIcon, MailIcon } from '../components/Icons.jsx';

/** /forgot-password - request a reset link by email. */
export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle={`If an account exists for ${email}, we've sent a link to reset your password.`}>
        <div className="auth-form">
          <div className="success-mark"><MailIcon size={28} /></div>
          <p className="muted center">The link expires in 30 minutes. Don't see it? Check your spam folder.</p>
          <Link to="/login" className="button button-primary button-full button-tall">Back to sign in</Link>
          <button type="button" className="link center" onClick={() => setSent(false)}>Use a different email</button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                 autoComplete="email" placeholder="you@example.com" autoFocus />
        </label>

        {error && <div className="banner banner-error" role="alert">{error}</div>}

        <button type="submit" className="button button-primary button-full button-tall" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Sending…' : 'Send reset link'}
        </button>

        <Link to="/login" className="button button-ghost button-full"><ArrowLeftIcon size={18} /> Back to sign in</Link>
      </form>
    </AuthShell>
  );
}
