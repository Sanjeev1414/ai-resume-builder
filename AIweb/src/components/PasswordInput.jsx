import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons.jsx';

/** Password field with a show/hide toggle. */
export default function PasswordInput({ value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-wrap">
      <input type={visible ? 'text' : 'password'} value={value} onChange={onChange} required {...props} />
      <button type="button" className="icon-button password-toggle" onClick={() => setVisible(!visible)}
              aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </span>
  );
}

/** Simple strength hint shown under new-password fields. */
export function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const level = password.length < 8 ? 0 : Math.min(3, Math.ceil(score / 1.67));
  const labels = ['Too short', 'Weak', 'Good', 'Strong'];
  return (
    <span className={`strength strength-${level}`}>
      <span className="strength-bars"><i /><i /><i /></span>
      {labels[level]}
    </span>
  );
}
