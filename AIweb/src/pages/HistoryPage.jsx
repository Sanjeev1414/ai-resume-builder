import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchHistory } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import emptyImage from '../assets/empty.svg';
import { scoreLevel } from '../components/ScoreRing.jsx';
import { ArrowRightIcon, FileIcon, SparkleIcon } from '../components/Icons.jsx';

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
const formatTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** /history - every analysis this user has saved. */
export default function HistoryPage() {
  useDocumentTitle('History');
  const navigate = useNavigate();
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
      <div className="card history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th className="col-sno">S.No</th>
              <th>Resume</th>
              <th>Job description</th>
              <th className="col-score">Match score</th>
              <th className="col-score">ATS score</th>
              <th className="col-date">Date &amp; time</th>
              <th className="col-open"><span className="sr-only">Open</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const { tone, label } = scoreLevel(item.matchScore);
              const ats = item.atsScore == null ? null : scoreLevel(item.atsScore);
              const open = () => navigate(`/analyses/${item.id}`);
              return (
                <tr key={item.id} onClick={open}>
                  <td className="col-sno">{index + 1}</td>
                  <td className="col-file"><FileIcon size={15} /> {item.resumeFileName}</td>
                  <td className="col-desc" title={item.jobPreview}>{item.jobPreview}</td>
                  <td className="col-score">
                    <span className={`badge badge-${tone}`} title={label}>{item.matchScore}</span>
                  </td>
                  <td className="col-score">
                    {ats ? <span className={`badge badge-${ats.tone}`} title={ats.label}>{item.atsScore}</span> : <span className="muted">–</span>}
                  </td>
                  <td className="col-date">
                    <strong>{formatDate(item.createdAt)}</strong>
                    <span>{formatTime(item.createdAt)}</span>
                  </td>
                  <td className="col-open">
                    <Link to={`/analyses/${item.id}`} onClick={(e) => e.stopPropagation()} className="history-open">
                      View <ArrowRightIcon size={15} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
