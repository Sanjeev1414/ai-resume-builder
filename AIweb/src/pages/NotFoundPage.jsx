import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import emptyImage from '../assets/empty.svg';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="center-screen">
      <div className="card empty-state" style={{ maxWidth: 440 }}>
        <img src={emptyImage} alt="" width="200" height="150" />
        <h1 style={{ fontSize: '3rem' }}>404</h1>
        <p className="muted">We couldn't find that page.</p>
        <Link to="/" className="button button-primary">Go to home</Link>
      </div>
    </div>
  );
}
