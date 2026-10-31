import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import PasswordInput, { PasswordStrength } from '../components/PasswordInput.jsx';
import { KeyIcon, ShieldIcon } from '../components/Icons.jsx';

/** /account/password - change password while signed in. */
export default function ChangePasswordPage() {
  useDocumentTitle('Change password');
  const { user, signIn, showToast, handleAuthError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.next.length < 8) return setError('New password must be at least 8 characters.');
    if (form.next !== form.confirm) return setError('New passwords do not match.');
    setBusy(true);
    try {
      const auth = await changePassword(form.current, form.next);
      signIn(auth); // new token for this session; other sessions are signed out by the server
      showToast('Password updated', 'You have been signed out on your other devices.');
      navigate('/dashboard');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="account-layout">
      <aside className="card account-side">
        <span className="avatar avatar-xl">
          {user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
        </span>
        <h2>{user.name}</h2>
        <p className="muted">{user.email}</p>
        <div className="account-tip">
          <ShieldIcon size={18} />
          <span>Changing your password signs you out everywhere else.</span>
        </div>
      </aside>

      <form className="card account-form" onSubmit={handleSubmit}>
        <div className="card-title">
          <span className="card-title-icon tone-primary"><KeyIcon size={18} /></span>
          <h3>Change password</h3>
        </div>

        <div className="field">
          <label className="label" htmlFor="current">Current password</label>
          <PasswordInput id="current" value={form.current} onChange={update('current')} autoComplete="current-password" />
        </div>
        <div className="field">
          <label className="label" htmlFor="next">New password</label>
          <PasswordInput id="next" value={form.next} onChange={update('next')} minLength={8}
                         autoComplete="new-password" placeholder="At least 8 characters" />
          <PasswordStrength password={form.next} />
        </div>
        <div className="field">
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <PasswordInput id="confirm" value={form.confirm} onChange={update('confirm')} autoComplete="new-password" />
        </div>

        {error && <div className="banner banner-error" role="alert">{error}</div>}

        <div className="form-actions">
          <button type="button" className="button button-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  );
}
