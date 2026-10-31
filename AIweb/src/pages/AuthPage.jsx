import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login, register } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import AuthShell from '../components/AuthShell.jsx';
import PasswordInput, { PasswordStrength } from '../components/PasswordInput.jsx';

/** Sign-in (/login) and sign-up (/register) page. */
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  useDocumentTitle(isRegister ? 'Create account' : 'Sign in');

  const { signIn, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (isRegister && form.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    setBusy(true);
    try {
      const auth = isRegister
        ? await register(form.name, form.email, form.password)
        : await login(form.email, form.password);
      signIn(auth, isRegister ? 'register' : 'login');
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title={isRegister ? 'Create your account' : 'Welcome back'}
      subtitle={isRegister
        ? 'Get your AI resume match score in under a minute.'
        : 'Sign in to ResumeAI to analyze your resume.'}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {notice && <div className="banner banner-info">{notice}</div>}

        {isRegister && (
          <label className="field">
            <span className="label">Full name</span>
            <input type="text" value={form.name} onChange={update('name')} required
                   autoComplete="name" placeholder="Jane Doe" />
          </label>
        )}
        <label className="field">
          <span className="label">Email</span>
          <input type="email" value={form.email} onChange={update('email')} required
                 autoComplete="email" placeholder="you@example.com" />
        </label>
        <div className="field">
          <span className="label-row">
            <label className="label" htmlFor="password">Password</label>
            {!isRegister && <Link to="/forgot-password" className="link small">Forgot password?</Link>}
          </span>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={update('password')}
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'}
          />
          {isRegister && <PasswordStrength password={form.password} />}
        </div>

        {error && <div className="banner banner-error" role="alert">{error}</div>}

        <button type="submit" className="button button-primary button-full button-tall auth-submit" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <div className="auth-divider"><span>{isRegister ? 'Already a member?' : 'New to ResumeAI?'}</span></div>

        <Link className="button button-ghost button-full" to={isRegister ? '/login' : '/register'} state={location.state}>
          {isRegister ? 'Sign in instead' : 'Create a free account'}
        </Link>
      </form>
    </AuthShell>
  );
}
