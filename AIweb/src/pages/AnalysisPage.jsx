import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchAnalysis } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Results from '../components/Results.jsx';
import TailoredResume from '../components/TailoredResume.jsx';
import { ArrowLeftIcon, MailIcon } from '../components/Icons.jsx';

/** /analyses/:id - one saved report. Uses the result passed from the dashboard, or loads it. */
export default function AnalysisPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user, handleAuthError } = useAuth();
  const passed = location.state?.analysis;
  const [analysis, setAnalysis] = useState(passed?.id === Number(id) ? passed : null);
  const [error, setError] = useState('');

  useDocumentTitle(analysis ? `Report · ${analysis.result.matchScore}/100` : 'Report');

  useEffect(() => {
    if (analysis?.id === Number(id)) return;
    setError('');
    fetchAnalysis(id)
      .then(setAnalysis)
      .catch((e) => (handleAuthError(e) ? null : setError(e.message)));
  }, [id, analysis, handleAuthError]);

  if (error) {
    return (
      <div className="card empty-state">
        <h3>Report not available</h3>
        <p className="muted">{error}</p>
        <Link to="/history" className="button button-ghost"><ArrowLeftIcon size={18} /> Back to history</Link>
      </div>
    );
  }
  if (!analysis) return <div className="card skeleton" style={{ height: 240 }} />;

  const showEmailNotice = location.state?.justCreated && analysis.emailSent;

  return (
    <>
      <div className="results-head">
        <Link to="/dashboard" className="button button-ghost"><ArrowLeftIcon size={18} /> New analysis</Link>
        <span className="muted">
          {analysis.resumeFileName} · {new Date(analysis.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>
      {showEmailNotice && (
        <div className="banner banner-success"><MailIcon size={18} /> A copy of this report is on its way to {user.email}.</div>
      )}
      <Results result={analysis.result} />
      <TailoredResume analysisId={analysis.id} />
    </>
  );
}
