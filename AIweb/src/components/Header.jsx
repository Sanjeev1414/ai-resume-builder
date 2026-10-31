import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';
import UserMenu from './UserMenu.jsx';
import { CalendarIcon, MenuIcon } from './Icons.jsx';

const PAGES = [
  ['/dashboard', 'Resume Analyzer', 'Match your resume to a job and pass ATS filters'],
  ['/cover-letter', 'Cover Letter', 'Generate a tailored cover letter in seconds'],
  ['/interview-prep', 'Interview Prep', 'Practice the questions you are likely to be asked'],
  ['/resume-builder', 'Resume Builder', 'Build an ATS-friendly resume and download it as PDF'],
  ['/job-tracker', 'Job Tracker', 'Keep every application organised in one place'],
  ['/history', 'Analysis History', 'All your saved resume reports'],
  ['/analyses/', 'Report', 'Your resume analysis'],
  ['/account/password', 'Change password', 'Keep your account secure'],
];

/** Full-width top bar: logo, current page, date and account menu. */
export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();
  const [, title = '', subtitle = ''] = PAGES.find(([path]) => pathname.startsWith(path)) ?? [];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <header className="app-header">
      <div className="header-brand-area">
        <button type="button" className="icon-button menu-toggle" onClick={onMenuClick} aria-label="Open menu">
          <MenuIcon size={22} />
        </button>
        <Link to="/dashboard" className="header-brand">
          <img src={logo} alt="" width="36" height="36" />
          <span>Resume<b>AI</b></span>
        </Link>
      </div>

      <div className="header-heading">
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{subtitle}</p>
      </div>

      <span className="header-date"><CalendarIcon size={16} /> {today}</span>
      <UserMenu />
    </header>
  );
}
