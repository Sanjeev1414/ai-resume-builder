import { useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { CheckIcon, XIcon } from './Icons.jsx';

/** Corner notification that disappears after a few seconds. */
export default function Toast() {
  const { toast, dismissToast } = useAuth();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismissToast, 5000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div key={toast.id} className={`toast toast-${toast.tone}`} role="status" aria-live="polite">
      <span className="toast-icon"><CheckIcon size={18} /></span>
      <div className="toast-body">
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button type="button" className="toast-close" onClick={dismissToast} aria-label="Dismiss">
        <XIcon size={16} />
      </button>
      <span className="toast-progress" />
    </div>
  );
}
