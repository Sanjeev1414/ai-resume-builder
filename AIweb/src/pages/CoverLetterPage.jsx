import { useEffect, useState } from 'react';
import {
  deleteCoverLetter, fetchCoverLetters, generateCoverLetter, updateCoverLetter,
} from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import FileDropzone from '../components/FileDropzone.jsx';
import {
  CheckIcon, CopyIcon, DownloadIcon, EditIcon, SparkleIcon, TrashIcon,
} from '../components/Icons.jsx';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
  { value: 'concise', label: 'Concise' },
];

/** /cover-letter - generate, edit and keep AI cover letters. */
export default function CoverLetterPage() {
  useDocumentTitle('Cover Letter');
  const { handleAuthError, showToast } = useAuth();
  const [form, setForm] = useState({ companyName: '', jobTitle: '', tone: 'professional', jobDescription: '' });
  const [file, setFile] = useState(null);
  const [letters, setLetters] = useState([]);
  const [current, setCurrent] = useState(null);
  const [draft, setDraft] = useState({ subject: '', content: '' });
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCoverLetters().then(setLetters).catch(handleAuthError);
  }, [handleAuthError]);

  function open(letter) {
    setCurrent(letter);
    setDraft({ subject: letter.subject, content: letter.content });
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const dirty = current && (draft.subject !== current.subject || draft.content !== current.content);

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    if (!file) return setError('Please upload your resume (PDF).');
    if (form.jobDescription.trim().length < 50) return setError('Please paste the full job description.');
    setBusy(true);
    try {
      const letter = await generateCoverLetter({ ...form, resume: file });
      setLetters([letter, ...letters]);
      open(letter);
      showToast('Cover letter ready ✍️', 'Review it, make it yours, then copy or download.');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await updateCoverLetter(current.id, draft.subject, draft.content);
      setLetters(letters.map((l) => (l.id === saved.id ? saved : l)));
      setCurrent(saved);
      showToast('Changes saved');
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this cover letter?')) return;
    try {
      await deleteCoverLetter(current.id);
      setLetters(letters.filter((l) => l.id !== current.id));
      setCurrent(null);
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked
    }
  }

  function download() {
    const blob = new Blob([draft.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover Letter${current.companyName ? ` - ${current.companyName}` : ''}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="tool-grid">
      <div className="tool-side">
        <form className="card tool-form" onSubmit={handleGenerate}>
          <div className="card-title">
            <span className="card-title-icon tone-accent"><SparkleIcon size={18} /></span>
            <h3>New cover letter</h3>
          </div>

          <div className="field">
            <span className="label">Your resume (PDF)</span>
            <FileDropzone file={file} onFileChange={setFile} onError={setError} disabled={busy} />
          </div>
          <div className="field-row">
            <label className="field">
              <span className="label">Company</span>
              <input type="text" value={form.companyName} onChange={update('companyName')} placeholder="e.g. Google" maxLength={120} />
            </label>
            <label className="field">
              <span className="label">Job title</span>
              <input type="text" value={form.jobTitle} onChange={update('jobTitle')} placeholder="e.g. SDE-1" maxLength={120} />
            </label>
          </div>
          <div className="field">
            <span className="label">Tone</span>
            <div className="segmented" role="radiogroup" aria-label="Tone">
              {TONES.map((t) => (
                <button key={t.value} type="button" role="radio" aria-checked={form.tone === t.value}
                        className={form.tone === t.value ? 'active' : ''}
                        onClick={() => setForm({ ...form, tone: t.value })}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span className="label">Job description</span>
            <textarea rows={7} value={form.jobDescription} onChange={update('jobDescription')}
                      placeholder="Paste the full job post…" maxLength={20000} />
          </label>

          {error && <div className="banner banner-error" role="alert">{error}</div>}

          <button type="submit" className="button button-primary button-full" disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <SparkleIcon size={18} />}
            {busy ? 'Writing your letter…' : 'Generate cover letter'}
          </button>
        </form>

        <div className="card">
          <div className="card-title">
            <span className="card-title-icon tone-primary"><EditIcon size={18} /></span>
            <h3>Saved letters</h3>
            <span className="count">{letters.length}</span>
          </div>
          {letters.length === 0 ? (
            <p className="muted">Your cover letters will be saved here.</p>
          ) : (
            <ul className="saved-list">
              {letters.map((l) => (
                <li key={l.id}>
                  <button type="button" className={current?.id === l.id ? 'saved-item active' : 'saved-item'} onClick={() => open(l)}>
                    <strong>{l.companyName || l.subject}</strong>
                    <small>{[l.jobTitle, l.tone, new Date(l.createdAt).toLocaleDateString()].filter(Boolean).join(' · ')}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card tool-result">
        {busy && !current && (
          <div className="tool-empty"><span className="spinner spinner-large" /><p className="muted">Writing a letter tailored to this job…</p></div>
        )}
        {!busy && !current && (
          <div className="tool-empty">
            <span className="tool-empty-icon"><EditIcon size={30} /></span>
            <h3>Your cover letter will appear here</h3>
            <p className="muted">Upload your resume, paste the job post and pick a tone. The AI writes a personal letter using only real facts from your resume.</p>
          </div>
        )}
        {current && (
          <>
            <div className="letter-toolbar">
              <input className="letter-subject" value={draft.subject} aria-label="Subject"
                     onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
              <div className="toolbar-actions">
                <button type="button" className="button button-ghost button-small" onClick={copy}>
                  {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" className="button button-ghost button-small" onClick={download}>
                  <DownloadIcon size={16} /> Download
                </button>
                <button type="button" className="icon-button" onClick={handleDelete} aria-label="Delete letter" title="Delete">
                  <TrashIcon size={18} />
                </button>
              </div>
            </div>
            <textarea className="letter-body" value={draft.content} aria-label="Cover letter"
                      onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
            <div className="letter-footer">
              <span className="muted">{draft.content.trim().split(/\s+/).filter(Boolean).length} words</span>
              <button type="button" className="button button-primary button-small" disabled={!dirty || saving} onClick={handleSave}>
                {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
