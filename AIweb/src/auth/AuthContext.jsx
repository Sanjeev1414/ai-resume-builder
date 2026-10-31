import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthError, fetchMe, getToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState(null);

  // Restore the session from a saved token on page load
  useEffect(() => {
    if (!getToken()) return;
    fetchMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  /** Shows a small message in the corner, e.g. "Signed in successfully". */
  const showToast = useCallback((title, message = '', tone = 'success') => {
    setToast({ id: Date.now(), title, message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  /** Stores the token; `welcome` is 'login' or 'register' to greet the user, or null for a silent refresh. */
  const signIn = useCallback(({ token, user: signedInUser }, welcome = null) => {
    setToken(token);
    setUser(signedInUser);
    setNotice('');
    const firstName = signedInUser.name.split(' ')[0];
    if (welcome === 'register') {
      showToast(`Welcome to ResumeAI, ${firstName}! 🎉`, 'Your account is ready. Upload a resume to get your first score.');
    } else if (welcome === 'login') {
      showToast(`Welcome back, ${firstName}! 👋`, 'You have signed in successfully.');
    }
  }, [showToast]);

  const signOut = useCallback((message = '') => {
    setToken(null);
    setUser(null);
    setNotice(message);
  }, []);

  /** Returns true if the error meant "session expired" and was handled by signing out. */
  const handleAuthError = useCallback((e) => {
    if (e instanceof AuthError) {
      signOut(e.message);
      return true;
    }
    return false;
  }, [signOut]);

  const value = useMemo(
    () => ({ user, checking, notice, setNotice, toast, showToast, dismissToast, signIn, signOut, handleAuthError }),
    [user, checking, notice, toast, showToast, dismissToast, signIn, signOut, handleAuthError],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
