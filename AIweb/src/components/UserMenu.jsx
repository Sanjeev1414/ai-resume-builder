import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { KeyIcon, LogoutIcon } from './Icons.jsx';

/** Avatar that opens a small dropdown (name, email, change password), plus the sign-out button. */
export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="avatar-button" onClick={() => setOpen(!open)}
              aria-haspopup="menu" aria-expanded={open} aria-label="Account menu">
        <span className="avatar">{initials}</span>
      </button>

      {open && (
        <div className="menu" role="menu">
          <div className="menu-user">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <div className="menu-divider" />
          <Link to="/account/password" className="menu-item" role="menuitem" onClick={() => setOpen(false)}>
            <KeyIcon size={18} /> Change password
          </Link>
        </div>
      )}

      <button type="button" className="icon-button" onClick={() => signOut()} aria-label="Sign out" title="Sign out">
        <LogoutIcon size={18} />
      </button>
    </div>
  );
}
