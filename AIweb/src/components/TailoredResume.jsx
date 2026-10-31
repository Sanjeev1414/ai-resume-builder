import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailTailoredResume, fetchTailoredResume, generateTailoredResume, saveResumeDraft } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import FileDropzone from './FileDropzone.jsx';
import ResumePreview, { printResume, TemplatePicker, toBuilderResume } from './ResumePreview.jsx';
import { DownloadIcon, EditIcon, MailIcon, SparkleIcon } from './Icons.jsx';

/** Report section: AI rewrites the analysed resume for this job, then download (PDF) or email it. */
export default function TailoredResume({ analysisId }) {
  const navigate = useNavigate();
  const { user, handleAuthError } = useAuth();
  const [data, setData] = useState(null);
  const [template, setTemplate] = useState('classic');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setData(null);
    fetchTailoredResume(analysisId)
      .then(setData)
      .catch((e) => { if (!handleAuthError(e)) setError(e.message); });
  }, [analysisId, handleAuthError]);

  async function run(kind, action) {
    setBusy(kind);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (e) {
      if (!handleAuthError(e)) setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const generate = () => run('generate', async () => {
    setData(await generateTailoredResume(analysisId, file));
    setFile(null);
  });

  const email = () => run('email', async () => {
    await emailTailoredResume(analysisId, template);
    setNotice(`Sent to ${user.email} - check your inbox in a minute.`);
  });

  const openInBuilder = () => {
    if (!window.confirm('This replaces your current Resume Builder draft with the tailored resume. Continue?')) return;
    run('builder', async () => {
      await saveResumeDraft(toBuilderResume(data.resume, template));
      navigate('/resume-builder');
    });
  };

  if (!data && !error) return <div className="card skeleton" style={{ height: 160 }} />;

  const resume = data?.resume ? toBuilderResume(data.resume, template) : null;
  const needsUpload = data && !data.hasSourceResume;

  return (
    <section className="card tailored">
      <div className="card-title">
        <span className="card-title-icon tone-accent"><SparkleIcon size={18} /></span>
        <h3>Tailored resume for this job</h3>
        {data?.generatedAt && (
          <span className="muted small">Generated {new Date(data.generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
        )}
      </div>

      {error && <div className="banner banner-error" role="alert">{error}</div>}
      {notice && <div className="banner banner-success"><MailIcon size={18} /> {notice}</div>}

      {!resume ? (
        <div className="tailored-intro">
          <p>
            AI rewrites your resume for this job description: the job's keywords first, stronger bullet points
            and an ATS-friendly single-column layout. Only facts from your resume are used - nothing is invented.
          </p>
          {needsUpload && (
            <>
              <p className="muted">This report was created before resumes were saved. Upload the same resume once:</p>
              <FileDropzone file={file} onFileChange={setFile} onError={setError} disabled={!!busy} />
            </>
          )}
          <button type="button" className="button button-primary" onClick={generate}
                  disabled={!!busy || (needsUpload && !file)}>
            <SparkleIcon size={18} /> {busy === 'generate' ? 'Generating… (about 30 seconds)' : 'Generate tailored resume'}
          </button>
        </div>
      ) : (
        <>
          <p className="label">Choose an ATS-friendly template</p>
          <TemplatePicker value={template} onChange={setTemplate} />

          <div className="tailored-actions">
            <button type="button" className="button button-primary"
                    onClick={() => printResume(`${resume.fullName || 'Tailored'} Resume`)}>
              <DownloadIcon size={18} /> Download PDF
            </button>
            <button type="button" className="button button-ghost" onClick={email} disabled={!!busy}>
              <MailIcon size={18} /> {busy === 'email' ? 'Sending…' : 'Email to me'}
            </button>
            <button type="button" className="button button-ghost" onClick={openInBuilder} disabled={!!busy}>
              <EditIcon size={18} /> Edit in Resume Builder
            </button>
            <button type="button" className="button button-ghost" onClick={generate} disabled={!!busy}>
              <SparkleIcon size={18} /> {busy === 'generate' ? 'Regenerating…' : 'Regenerate'}
            </button>
          </div>
          <p className="hint">In the print window choose <strong>Save as PDF</strong> as the destination. The text stays selectable, so ATS software can read it.</p>

          <div className="tailored-preview print-root">
            <ResumePreview r={resume} template={template} />
          </div>
        </>
      )}
    </section>
  );
}
