import logo from '../assets/logo.svg';
import background from '../assets/auth-bg.svg';
import { MailIcon, ShieldIcon, SparkleIcon, TargetIcon } from './Icons.jsx';

const FEATURES = [
  { icon: TargetIcon, text: 'Match score' },
  { icon: SparkleIcon, text: 'AI rewrites' },
  { icon: MailIcon, text: 'Email reports' },
  { icon: ShieldIcon, text: 'Private & secure' },
];

/** Full-screen background with a centered card - shared by sign-in, sign-up and password pages. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth-screen" style={{ backgroundImage: `url(${background})` }}>
      <div className="auth-center">
        <div className="auth-card">
          <div className="auth-card-head">
            <img src={logo} alt="" width="52" height="52" className="auth-logo" />
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {children}
        </div>

        <ul className="auth-features">
          {FEATURES.map(({ icon: FeatureIcon, text }) => (
            <li key={text}><FeatureIcon size={16} /> {text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
