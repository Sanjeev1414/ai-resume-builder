import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHistory } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import emptyImage from '../assets/empty.svg';
import { scoreLevel } from '../components/ScoreRing.jsx';
import { FileIcon, SparkleIcon } from '../components/Icons.jsx';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** /history - every analysis this user has saved. */
export default function HistoryPage() {
  useDocumentTitle('History');
  const { handleAuthError } = useAuth();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch((e) => (handleAuthError(e) ? null : setError(e.message)));
  }, [handleAuthError]);

  if (error) return <div className="banner banner-error" role="alert">{error}</div>;

  if (!items) {
    return (
      <ul className="history">
        {[0, 1, 2].map((i) => <li key={i} className="card skeleton" />)}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <img src={emptyImage} alt="" width="200" height="150" />
        <h3>No analyses yet</h3>
        <p className="muted">Your saved resume reports will show up here.</p>
        <Link to="/dashboard" className="button button-primary"><SparkleIcon size={18} /> Run your first analysis</Link>
      </div>
    );
  }

  return (
    <>
      <div className="section-head">
        <h2>Your analyses</h2>
        <span className="muted">{items.length} saved</span>
      </div>
      <ul className="history">
        {items.map((item) => {
          const { tone, label } = scoreLevel(item.matchScore);
          return (
            <li key={item.id}>
              <Link to={`/analyses/${item.id}`} className="card history-item">
                <span className={`badge badge-${tone}`} title={label}>{item.matchScore}</span>
                <span className="history-text">
                  <strong><FileIcon size={15} /> {item.resumeFileName}</strong>
                  <span className="muted">{item.jobPreview}</span>
                </span>
                <span className="history-date">{formatDate(item.createdAt)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
