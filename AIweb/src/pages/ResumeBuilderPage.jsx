import { useEffect, useRef, useState } from 'react';
import { fetchResumeDraft, saveResumeDraft } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { CheckIcon, DownloadIcon, PlusIcon, TrashIcon } from '../components/Icons.jsx';
import ResumePreview, { printResume, TemplatePicker } from '../components/ResumePreview.jsx';

const NEW_EXPERIENCE = { role: '', company: '', location: '', start: '', end: '', bullets: '' };
const NEW_PROJECT = { name: '', tech: '', link: '', bullets: '' };
const NEW_EDUCATION = { degree: '', school: '', year: '', score: '' };

function emptyResume(user) {
  return {
    fullName: user.name, title: '', email: user.email, phone: '', location: '', linkedin: '', website: '',
    summary: '', skills: '', experience: [{ ...NEW_EXPERIENCE }], projects: [], education: [{ ...NEW_EDUCATION }],
    certifications: '', template: 'classic',
  };
}

function ListSection({ title, items, template, onChange, render }) {
  const set = (index, field, value) => onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  return (
    <fieldset className="builder-section">
      <legend>{title}</legend>
      {items.map((item, i) => (
        <div key={i} className="builder-entry">
          {render(item, (field) => (e) => set(i, field, e.target.value))}
          <button type="button" className="link-danger" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <TrashIcon size={14} /> Remove
          </button>
        </div>
      ))}
      <button type="button" className="button button-ghost button-small" onClick={() => onChange([...items, { ...template }])}>
        <PlusIcon size={16} /> Add {title.toLowerCase().replace(/s$/, '')}
      </button>
    </fieldset>
  );
}

/** /resume-builder - form on the left, live printable preview on the right, auto-saved. */
export default function ResumeBuilderPage() {
  useDocumentTitle('Resume Builder');
  const { user, handleAuthError } = useAuth();
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState('');
  const loaded = useRef(false);

  useEffect(() => {
    fetchResumeDraft()
      .then(({ data }) => setResume(data ? { ...emptyResume(user), ...data } : emptyResume(user)))
      .catch((e) => { handleAuthError(e); setResume(emptyResume(user)); });
  }, [user, handleAuthError]);

  // Auto-save a second after the user stops typing
  useEffect(() => {
    if (!resume) return undefined;
    if (!loaded.current) { loaded.current = true; return undefined; }
    setStatus('Saving…');
    const timer = setTimeout(() => {
      saveResumeDraft(resume)
        .then(() => setStatus('Saved'))
        .catch((e) => { if (!handleAuthError(e)) setStatus('Not saved - ' + e.message); });
    }, 1000);
    return () => clearTimeout(timer);
  }, [resume, handleAuthError]);

  if (!resume) return <div className="card skeleton" style={{ height: 400 }} />;

  const field = (name) => (e) => setResume({ ...resume, [name]: e.target.value });
  const setList = (name) => (items) => setResume({ ...resume, [name]: items });

  return (
    <div className="builder">
      <div className="builder-form card">
        <div className="builder-toolbar">
          <span className="save-status">{status === 'Saved' && <CheckIcon size={16} />} {status || 'Changes save automatically'}</span>
          <button type="button" className="button button-primary button-small" onClick={() => printResume(`${resume.fullName || 'My'} Resume`)}>
            <DownloadIcon size={16} /> Download PDF
          </button>
        </div>

        <fieldset className="builder-section">
          <legend>Template</legend>
          <TemplatePicker value={resume.template} onChange={(template) => setResume({ ...resume, template })} />
        </fieldset>

        <fieldset className="builder-section">
          <legend>Personal details</legend>
          <div className="field-row">
            <label className="field"><span className="label">Full name</span><input type="text" value={resume.fullName} onChange={field('fullName')} /></label>
            <label className="field"><span className="label">Job title</span><input type="text" value={resume.title} onChange={field('title')} placeholder="e.g. Java Full Stack Developer" /></label>
          </div>
          <div className="field-row">
            <label className="field"><span className="label">Email</span><input type="email" value={resume.email} onChange={field('email')} /></label>
            <label className="field"><span className="label">Phone</span><input type="text" value={resume.phone} onChange={field('phone')} placeholder="+91 90000 00000" /></label>
          </div>
          <div className="field-row">
            <label className="field"><span className="label">Location</span><input type="text" value={resume.location} onChange={field('location')} placeholder="Bengaluru, India" /></label>
            <label className="field"><span className="label">LinkedIn</span><input type="text" value={resume.linkedin} onChange={field('linkedin')} placeholder="linkedin.com/in/you" /></label>
          </div>
          <label className="field"><span className="label">GitHub / Portfolio</span><input type="text" value={resume.website} onChange={field('website')} placeholder="github.com/you" /></label>
        </fieldset>

        <fieldset className="builder-section">
          <legend>Summary</legend>
          <textarea rows={4} value={resume.summary} onChange={field('summary')}
                    placeholder="2-3 lines: who you are, your strongest skills, and what you're looking for." />
        </fieldset>

        <fieldset className="builder-section">
          <legend>Skills</legend>
          <textarea rows={3} value={resume.skills} onChange={field('skills')}
                    placeholder="Java, Spring Boot, React, MySQL, Docker, AWS, Git" />
          <p className="hint">Use the exact skill names from job posts - ATS searches for them.</p>
        </fieldset>

        <ListSection title="Experience" items={resume.experience} template={NEW_EXPERIENCE} onChange={setList('experience')}
          render={(e, set) => (
            <>
              <div className="field-row">
                <label className="field"><span className="label">Role</span><input type="text" value={e.role} onChange={set('role')} /></label>
                <label className="field"><span className="label">Company</span><input type="text" value={e.company} onChange={set('company')} /></label>
              </div>
              <div className="field-row three">
                <label className="field"><span className="label">Start</span><input type="text" value={e.start} onChange={set('start')} placeholder="Jan 2024" /></label>
                <label className="field"><span className="label">End</span><input type="text" value={e.end} onChange={set('end')} placeholder="Present" /></label>
                <label className="field"><span className="label">Location</span><input type="text" value={e.location} onChange={set('location')} /></label>
              </div>
              <label className="field"><span className="label">Achievements (one per line)</span>
                <textarea rows={4} value={e.bullets} onChange={set('bullets')} placeholder="Built 12 REST APIs in Spring Boot serving 50K users" />
              </label>
            </>
          )} />

        <ListSection title="Projects" items={resume.projects} template={NEW_PROJECT} onChange={setList('projects')}
          render={(p, set) => (
            <>
              <div className="field-row">
                <label className="field"><span className="label">Project name</span><input type="text" value={p.name} onChange={set('name')} /></label>
                <label className="field"><span className="label">Tech used</span><input type="text" value={p.tech} onChange={set('tech')} placeholder="React, Spring Boot" /></label>
              </div>
              <label className="field"><span className="label">Link</span><input type="text" value={p.link} onChange={set('link')} placeholder="github.com/you/project" /></label>
              <label className="field"><span className="label">What you did (one per line)</span>
                <textarea rows={3} value={p.bullets} onChange={set('bullets')} />
              </label>
            </>
          )} />

        <ListSection title="Education" items={resume.education} template={NEW_EDUCATION} onChange={setList('education')}
          render={(e, set) => (
            <>
              <div className="field-row">
                <label className="field"><span className="label">Degree</span><input type="text" value={e.degree} onChange={set('degree')} placeholder="B.E. Computer Science" /></label>
                <label className="field"><span className="label">College / University</span><input type="text" value={e.school} onChange={set('school')} /></label>
              </div>
              <div className="field-row">
                <label className="field"><span className="label">Year</span><input type="text" value={e.year} onChange={set('year')} placeholder="2020 - 2024" /></label>
                <label className="field"><span className="label">CGPA / %</span><input type="text" value={e.score} onChange={set('score')} placeholder="CGPA 8.5" /></label>
              </div>
            </>
          )} />

        <fieldset className="builder-section">
          <legend>Certifications</legend>
          <textarea rows={3} value={resume.certifications} onChange={field('certifications')}
                    placeholder="One per line, e.g. AWS Certified Cloud Practitioner (2025)" />
        </fieldset>
      </div>

      <div className="builder-preview">
        <div className="preview-label">Live preview · ATS-friendly layout</div>
        <div className="print-root"><ResumePreview r={resume} template={resume.template} /></div>
      </div>
    </div>
  );
}
