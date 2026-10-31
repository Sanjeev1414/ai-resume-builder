import { useEffect, useState } from 'react';
import {
  deleteInterviewPrep, fetchInterviewPrep, fetchInterviewPreps, generateInterviewPrep,
} from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import FileDropzone from '../components/FileDropzone.jsx';
import { ChevronIcon, LightbulbIcon, MicIcon, SparkleIcon, TargetIcon, TrashIcon } from '../components/Icons.jsx';

const CATEGORIES = ['All', 'Technical', 'Behavioral', 'Role-specific', 'HR'];

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={open ? 'qa open' : 'qa'}>
      <button type="button" className="qa-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="qa-number">{index + 1}</span>
        <span className="qa-text">
          <span className={`qa-tag tag-${q.category.toLowerCase().replace(/\W/g, '')}`}>{q.category}</span>
          <strong>{q.question}</strong>
          <small>{q.whyAsked}</small>
        </span>
        <ChevronIcon size={20} className="qa-chevron" />
      </button>
      {open && (
        <div className="qa-body">
          <h4><LightbulbIcon size={16} /> How to answer</h4>
          <ul>{q.answerTips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
          <h4><MicIcon size={16} /> Sample answer</h4>
          <p className="qa-sample">{q.sampleAnswer}</p>
        </div>
      )}
    </li>
  );
}

/** /interview-prep - AI interview questions with tips and sample answers. */
export default function InterviewPrepPage() {
  useDocumentTitle('Interview Prep');
  const { handleAuthError, showToast } = useAuth();
  const [form, setForm] = useState({ jobTitle: '', companyName: '', jobDescription: '' });
  const [file, setFile] = useState(null);
  const [preps, setPreps] = useState([]);
  const [current, setCurrent] = useState(null);
  const [filter, setFilter] = useState('All');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInterviewPreps().then(setPreps).catch(handleAuthError);
  }, [handleAuthError]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    if (form.jobDescription.trim().length < 50) return setError('Please paste the full job description.');
    setBusy(true);
    try {
      const prep = await generateInterviewPrep({ ...form, resume: file });
      setCurrent(prep);
      setFilter('All');
      setPreps([{ id: prep.id, jobTitle: prep.jobTitle, companyName: prep.companyName,
        questionCount: prep.result.questions.length, createdAt: prep.createdAt }, ...preps]);
      showToast('Interview questions ready 🎯', 'Open each question to see tips and a sample answer.');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function openPrep(id) {
    setError('');
    try {
      setCurrent(await fetchInterviewPrep(id));
      setFilter('All');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this interview prep?')) return;
    try {
      await deleteInterviewPrep(current.id);
      setPreps(preps.filter((p) => p.id !== current.id));
      setCurrent(null);
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    }
  }

  const questions = current?.result.questions ?? [];
  const visible = filter === 'All' ? questions : questions.filter((q) => q.category === filter);

  return (
    <div className="tool-grid">
      <div className="tool-side">
        <form className="card tool-form" onSubmit={handleGenerate}>
          <div className="card-title">
            <span className="card-title-icon tone-accent"><SparkleIcon size={18} /></span>
            <h3>Prepare for an interview</h3>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="label">Job title</span>
              <input type="text" value={form.jobTitle} onChange={update('jobTitle')} placeholder="e.g. Data Engineer" maxLength={120} />
            </label>
            <label className="field">
              <span className="label">Company</span>
              <input type="text" value={form.companyName} onChange={update('companyName')} placeholder="e.g. Amazon" maxLength={120} />
            </label>
          </div>
          <label className="field">
            <span className="label">Job description</span>
            <textarea rows={7} value={form.jobDescription} onChange={update('jobDescription')}
                      placeholder="Paste the full job post…" maxLength={20000} />
          </label>
          <div className="field">
            <span className="label">Resume <span className="muted">(optional - for personalised answers)</span></span>
            <FileDropzone file={file} onFileChange={setFile} onError={setError} disabled={busy} />
          </div>

          {error && <div className="banner banner-error" role="alert">{error}</div>}

          <button type="submit" className="button button-primary button-full" disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <SparkleIcon size={18} />}
            {busy ? 'Preparing questions…' : 'Generate questions'}
          </button>
        </form>

        <div className="card">
          <div className="card-title">
            <span className="card-title-icon tone-primary"><MicIcon size={18} /></span>
            <h3>Saved preps</h3>
            <span className="count">{preps.length}</span>
          </div>
          {preps.length === 0 ? (
            <p className="muted">Your interview preps will be saved here.</p>
          ) : (
            <ul className="saved-list">
              {preps.map((p) => (
                <li key={p.id}>
                  <button type="button" className={current?.id === p.id ? 'saved-item active' : 'saved-item'} onClick={() => openPrep(p.id)}>
                    <strong>{p.jobTitle || 'Interview prep'}{p.companyName ? ` · ${p.companyName}` : ''}</strong>
                    <small>{p.questionCount} questions · {new Date(p.createdAt).toLocaleDateString()}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card tool-result">
        {busy && !current && (
          <div className="tool-empty"><span className="spinner spinner-large" /><p className="muted">Thinking like your interviewer…</p></div>
        )}
        {!busy && !current && (
          <div className="tool-empty">
            <span className="tool-empty-icon"><MicIcon size={30} /></span>
            <h3>Practice before the real thing</h3>
            <p className="muted">Paste a job post to get the technical, behavioral and HR questions you're most likely to face - with tips and sample answers.</p>
          </div>
        )}
        {current && (
          <>
            <div className="prep-head">
              <div>
                <h2>{current.jobTitle || 'Interview prep'}{current.companyName ? ` · ${current.companyName}` : ''}</h2>
                <p className="muted">{questions.length} questions · {new Date(current.createdAt).toLocaleDateString()}</p>
              </div>
              <button type="button" className="icon-button" onClick={handleDelete} aria-label="Delete prep" title="Delete">
                <TrashIcon size={18} />
              </button>
            </div>

            {current.result.focusAreas.length > 0 && (
              <div className="focus-areas">
                <span className="label"><TargetIcon size={16} /> Revise these topics</span>
                <ul className="chips">
                  {current.result.focusAreas.map((f) => <li key={f} className="chip chip-accent">{f}</li>)}
                </ul>
              </div>
            )}

            <div className="filter-tabs" role="tablist">
              {CATEGORIES.map((c) => {
                const count = c === 'All' ? questions.length : questions.filter((q) => q.category === c).length;
                if (c !== 'All' && count === 0) return null;
                return (
                  <button key={c} type="button" role="tab" aria-selected={filter === c}
                          className={filter === c ? 'active' : ''} onClick={() => setFilter(c)}>
                    {c} <span>{count}</span>
                  </button>
                );
              })}
            </div>

            <ol className="qa-list">
              {visible.map((q) => <QuestionCard key={q.question} q={q} index={questions.indexOf(q)} />)}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
