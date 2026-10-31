import { useState } from 'react';
import FileDropzone from './FileDropzone.jsx';
import { SparkleIcon } from './Icons.jsx';

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 20000;

export default function UploadForm({ onAnalyze, loading }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [formError, setFormError] = useState('');

  const jdLength = jobDescription.trim().length;

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setFormError('Please upload your resume (PDF).');
    if (jdLength < MIN_JD_LENGTH) return setFormError('Please paste the full job description.');
    setFormError('');
    onAnalyze(file, jobDescription);
  }

  return (
    <form className="card upload-form" onSubmit={handleSubmit}>
      <div className="step">
        <div className="step-head">
          <span className="step-number">1</span>
          <div>
            <h3>Upload your resume</h3>
            <p className="muted">We read it securely and never share it.</p>
          </div>
        </div>
        <FileDropzone file={file} onFileChange={setFile} onError={setFormError} disabled={loading} />
      </div>

      <div className="step">
        <div className="step-head">
          <span className="step-number">2</span>
          <div>
            <h3>Paste the job description</h3>
            <p className="muted">Include responsibilities and requirements for the best results.</p>
          </div>
        </div>
        <textarea
          rows={9}
          placeholder="e.g. We're looking for a Java Developer with 2+ years of Spring Boot, REST APIs, SQL…"
          value={jobDescription}
          maxLength={MAX_JD_LENGTH}
          onChange={(e) => setJobDescription(e.target.value)}
          disabled={loading}
        />
        <div className={`char-count${jdLength > 0 && jdLength < MIN_JD_LENGTH ? ' warn' : ''}`}>
          {jdLength.toLocaleString()} / {MAX_JD_LENGTH.toLocaleString()} characters
          {jdLength > 0 && jdLength < MIN_JD_LENGTH && ` · at least ${MIN_JD_LENGTH} needed`}
        </div>
      </div>

      {formError && <div className="banner banner-error" role="alert">{formError}</div>}

      <button type="submit" className="button button-primary button-large" disabled={loading}>
        <SparkleIcon size={20} /> Analyze my resume
      </button>
    </form>
  );
}
