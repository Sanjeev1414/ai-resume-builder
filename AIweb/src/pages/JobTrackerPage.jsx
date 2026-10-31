import { useEffect, useState } from 'react';
import {
  createApplication, deleteApplication, fetchApplications, updateApplication,
} from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { BriefcaseIcon, EditIcon, LinkIcon, PlusIcon, TrashIcon, XIcon } from '../components/Icons.jsx';

const STATUSES = [
  { value: 'WISHLIST', label: 'Wishlist', tone: 'wishlist' },
  { value: 'APPLIED', label: 'Applied', tone: 'applied' },
  { value: 'INTERVIEW', label: 'Interview', tone: 'interview' },
  { value: 'OFFER', label: 'Offer', tone: 'offer' },
  { value: 'REJECTED', label: 'Rejected', tone: 'rejected' },
];

const EMPTY = { company: '', role: '', status: 'APPLIED', location: '', jobUrl: '', appliedOn: '', notes: '' };

function ApplicationForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({ ...form, appliedOn: form.appliedOn || null });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal card" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-label="Application">
        <div className="modal-head">
          <h3>{initial?.id ? 'Edit application' : 'Add application'}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><XIcon size={18} /></button>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="label">Company *</span>
            <input type="text" value={form.company} onChange={update('company')} required maxLength={120} placeholder="e.g. Microsoft" autoFocus />
          </label>
          <label className="field">
            <span className="label">Role *</span>
            <input type="text" value={form.role} onChange={update('role')} required maxLength={120} placeholder="e.g. SDE-1" />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="label">Status</span>
            <select value={form.status} onChange={update('status')}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label className="field">
            <span className="label">Applied on</span>
            <input type="date" value={form.appliedOn ?? ''} onChange={update('appliedOn')} />
          </label>
        </div>
        <div className="field-row">
          <label className="field">
            <span className="label">Location</span>
            <input type="text" value={form.location ?? ''} onChange={update('location')} maxLength={120} placeholder="e.g. Bengaluru / Remote" />
          </label>
          <label className="field">
            <span className="label">Job link</span>
            <input type="url" value={form.jobUrl ?? ''} onChange={update('jobUrl')} maxLength={500} placeholder="https://…" />
          </label>
        </div>
        <label className="field">
          <span className="label">Notes</span>
          <textarea rows={3} value={form.notes ?? ''} onChange={update('notes')} maxLength={5000}
                    placeholder="Recruiter name, interview date, referral…" />
        </label>
        {error && <div className="banner banner-error" role="alert">{error}</div>}
        <div className="form-actions">
          <button type="button" className="button button-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}

/** /job-tracker - a board of job applications grouped by status. */
export default function JobTrackerPage() {
  useDocumentTitle('Job Tracker');
  const { handleAuthError } = useAuth();
  const [apps, setApps] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplications()
      .then(setApps)
      .catch((e) => (handleAuthError(e) ? null : setError(e.message)));
  }, [handleAuthError]);

  async function save(data) {
    try {
      const saved = editing.id ? await updateApplication(editing.id, data) : await createApplication(data);
      setApps(editing.id ? apps.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...apps]);
      setEditing(null);
    } catch (err) {
      if (!handleAuthError(err)) throw err;
    }
  }

  async function move(app, status) {
    try {
      const saved = await updateApplication(app.id, { ...app, status });
      setApps(apps.map((a) => (a.id === saved.id ? saved : a)));
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    }
  }

  async function remove(app) {
    if (!window.confirm(`Delete ${app.role} at ${app.company}?`)) return;
    try {
      await deleteApplication(app.id);
      setApps(apps.filter((a) => a.id !== app.id));
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    }
  }

  if (!apps && !error) return <div className="card skeleton" style={{ height: 300 }} />;

  return (
    <>
      <div className="tracker-head">
        <div className="tracker-stats">
          {STATUSES.map((s) => (
            <div key={s.value} className={`tracker-stat stat-${s.tone}`}>
              <strong>{apps?.filter((a) => a.status === s.value).length ?? 0}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <button type="button" className="button button-primary" onClick={() => setEditing({})}>
          <PlusIcon size={18} /> Add application
        </button>
      </div>

      {error && <div className="banner banner-error" role="alert">{error}</div>}

      {apps && apps.length === 0 ? (
        <div className="card empty-state tracker-empty">
          <span className="tool-empty-icon"><BriefcaseIcon size={30} /></span>
          <h3>Track your job hunt</h3>
          <p className="muted">Add the jobs you're applying to and move them along as you hear back.</p>
          <button type="button" className="button button-primary" onClick={() => setEditing({})}>
            <PlusIcon size={18} /> Add your first application
          </button>
        </div>
      ) : (
        <div className="board">
          {STATUSES.map((s) => {
            const column = apps?.filter((a) => a.status === s.value) ?? [];
            return (
              <section key={s.value} className={`board-col col-${s.tone}`}>
                <header className="board-col-head">
                  <span className="board-dot" /> {s.label} <span className="count">{column.length}</span>
                </header>
                {column.map((app) => (
                  <article key={app.id} className="job-card">
                    <div className="job-card-top">
                      <span className="company-badge">{app.company[0].toUpperCase()}</span>
                      <div className="job-card-title">
                        <strong>{app.role}</strong>
                        <span>{app.company}</span>
                      </div>
                    </div>
                    {(app.location || app.appliedOn) && (
                      <p className="job-meta">{[app.location, app.appliedOn && `Applied ${new Date(app.appliedOn).toLocaleDateString()}`].filter(Boolean).join(' · ')}</p>
                    )}
                    {app.notes && <p className="job-notes">{app.notes}</p>}
                    <div className="job-card-actions">
                      <select value={app.status} onChange={(e) => move(app, e.target.value)} aria-label="Move to">
                        {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {app.jobUrl && (
                        <a className="icon-button" href={app.jobUrl} target="_blank" rel="noopener noreferrer" title="Open job post"><LinkIcon size={16} /></a>
                      )}
                      <button type="button" className="icon-button" onClick={() => setEditing(app)} title="Edit"><EditIcon size={16} /></button>
                      <button type="button" className="icon-button" onClick={() => remove(app)} title="Delete"><TrashIcon size={16} /></button>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {editing && <ApplicationForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
