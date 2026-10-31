import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { analyzeResume, fetchHistory } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import UploadForm from '../components/UploadForm.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { scoreLevel } from '../components/ScoreRing.jsx';
import {
  ArrowRightIcon, ChartIcon, EditIcon, FileIcon, SparkleIcon, TargetIcon, TrophyIcon,
} from '../components/Icons.jsx';

const HOW_IT_WORKS = [
  { icon: FileIcon, tone: 'tone-primary', title: 'Upload your resume', text: 'PDF, up to 10 MB.' },
  { icon: TargetIcon, tone: 'tone-ok', title: 'Paste the job post', text: 'The full description works best.' },
  { icon: EditIcon, tone: 'tone-good', title: 'Get your report', text: 'Match score, ATS check and rewritten bullets.' },
];

/** /dashboard - welcome banner with stats, the upload form, and a side panel. */
export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user, handleAuthError } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory().then(setHistory).catch(handleAuthError);
  }, [handleAuthError]);

  async function handleAnalyze(file, jobDescription) {
    setError('');
    setLoading(true);
    try {
      const saved = await analyzeResume(file, jobDescription);
      // Pass the result along so the report page doesn't need to fetch it again
      navigate(`/analyses/${saved.id}`, { state: { analysis: saved, justCreated: true } });
    } catch (e) {
      if (!handleAuthError(e)) setError(e.message);
      setLoading(false);
    }
  }

  if (loading) return <LoadingState />;

  const scores = history.map((h) => h.matchScore);
  const best = scores.length ? Math.max(...scores) : null;
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <section className="hero-banner">
        <div className="hero-text">
          <span className="eyebrow">{greeting}</span>
          <h1>{user.name.split(' ')[0]}, ready for your next role? 🚀</h1>
          <p>Match your resume to any job in under a minute and see exactly what recruiters will look for.</p>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <span><ChartIcon size={14} /> Analyses</span>
            <strong>{history.length}</strong>
          </div>
          <div className="hero-stat">
            <span><TrophyIcon size={14} /> Best score</span>
            <strong>{best ?? '–'}</strong>
          </div>
          <div className="hero-stat">
            <span><TargetIcon size={14} /> Average</span>
            <strong>{average ?? '–'}</strong>
          </div>
        </div>
      </section>

      {error && <div className="banner banner-error" role="alert">{error}</div>}

      <div className="dashboard-grid">
        <UploadForm onAnalyze={handleAnalyze} loading={loading} />

        <aside className="side-panel">
          <div className="card">
            <div className="card-title">
              <span className="card-title-icon tone-primary"><SparkleIcon size={18} /></span>
              <h3>How it works</h3>
            </div>
            <ol className="how-steps">
              {HOW_IT_WORKS.map(({ icon: StepIcon, tone, title, text }) => (
                <li key={title}>
                  <span className={tone}><StepIcon size={16} /></span>
                  <span><b>{title}</b><p>{text}</p></span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card">
            <div className="card-title">
              <span className="card-title-icon tone-good"><ChartIcon size={18} /></span>
              <h3>Recent reports</h3>
            </div>
            {history.length === 0 ? (
              <p className="muted">Your reports will appear here after your first analysis.</p>
            ) : (
              <>
                <ul className="recent-list">
                  {history.slice(0, 3).map((item) => (
                    <li key={item.id}>
                      <Link to={`/analyses/${item.id}`} className="recent-item">
                        <span className={`badge badge-${scoreLevel(item.matchScore).tone}`}>{item.matchScore}</span>
                        <span>
                          <strong>{item.resumeFileName}</strong>
                          <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/history" className="see-all">See all <ArrowRightIcon size={14} /></Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
