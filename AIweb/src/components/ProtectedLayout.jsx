import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

/** App shell for signed-in pages: full-width header on top, then sidebar + page + footer. */
export default function ProtectedLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever the page changes
  useEffect(() => setMenuOpen(false), [location.pathname]);

  if (!user) {
    // Remember where the user was going, so sign-in can send them back there
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-shell">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <div className="app-body">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="app-main">
          <main className="page">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
