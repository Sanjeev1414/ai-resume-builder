import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useAuth } from '../auth/AuthContext.jsx';
import {
  BriefcaseIcon, ClockIcon, CodeIcon, DatabaseIcon, EditIcon, GridIcon, KeyIcon, LayoutIcon, MicIcon, TargetIcon, XIcon,
} from './Icons.jsx';

/** Add a page here and it shows up in the sidebar. */
const NAV_SECTIONS = [
  {
    title: 'AI tools',
    items: [
      { to: '/dashboard', label: 'Resume Analyzer', icon: GridIcon },
      { to: '/cover-letter', label: 'Cover Letter', icon: EditIcon, badge: 'AI' },
      { to: '/interview-prep', label: 'Interview Prep', icon: MicIcon, badge: 'AI' },
    ],
  },
  {
    title: 'Career',
    items: [
      { to: '/resume-builder', label: 'Resume Builder', icon: LayoutIcon },
      { to: '/job-tracker', label: 'Job Tracker', icon: BriefcaseIcon },
      { to: '/history', label: 'Analysis History', icon: ClockIcon },
    ],
  },
  {
    title: 'Interview Preparation',
    items: [
      { to: '/interview/java', label: 'Java', icon: CodeIcon },
      { to: '/interview/sql', label: 'SQL', icon: DatabaseIcon },
      { to: '/interview/python', label: 'Python', icon: CodeIcon },
      { to: '/interview/html', label: 'HTML', icon: CodeIcon },
      { to: '/interview/css', label: 'CSS', icon: CodeIcon },
      { to: '/interview/react', label: 'React', icon: CodeIcon },
      { to: '/interview/dsa', label: 'DSA', icon: TargetIcon },
    ],
  },
  {
    title: 'Account',
    items: [{ to: '/account/password', label: 'Change password', icon: KeyIcon }],
  },
];

const linkClass = ({ isActive }) => (isActive ? 'side-link active' : 'side-link');

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside className={open ? 'sidebar open' : 'sidebar'} aria-label="Sidebar">
        <div className="sidebar-top">
          <Link to="/dashboard" className="sidebar-brand" onClick={onClose}>
            <img src={logo} alt="" width="34" height="34" />
            <span>Resume<b>AI</b></span>
          </Link>
          <button type="button" className="icon-button sidebar-close" onClick={onClose} aria-label="Close menu">
            <XIcon size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="side-section">
              <span className="side-title">{section.title}</span>
              {section.items.map(({ to, label, icon: ItemIcon, badge }) => (
                <NavLink key={to} to={to} className={linkClass} end={to === '/dashboard'} onClick={onClose}>
                  <ItemIcon size={18} />
                  <span className="side-label">{label}</span>
                  {badge && <span className="side-badge">{badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{initials}</span>
          <span className="sidebar-user-text">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
        </div>
      </aside>
    </>
  );
}
