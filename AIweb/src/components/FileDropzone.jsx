import { useRef, useState } from 'react';
import { FileIcon, UploadIcon, XIcon } from './Icons.jsx';

const MAX_FILE_MB = 10;

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Drag-and-drop (or click) PDF picker. Calls onError with a message for bad files. */
export default function FileDropzone({ file, onFileChange, onError, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function accept(picked) {
    if (!picked) return;
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) {
      return onError('Please choose a PDF file.');
    }
    if (picked.size > MAX_FILE_MB * 1024 * 1024) {
      return onError(`File is too large (max ${MAX_FILE_MB} MB).`);
    }
    onError('');
    onFileChange(picked);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) accept(e.dataTransfer.files[0]);
  }

  function clear() {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  if (file) {
    return (
      <div className="file-chip">
        <span className="file-chip-icon"><FileIcon size={22} /></span>
        <span className="file-chip-text">
          <strong>{file.name}</strong>
          <span className="muted">{formatSize(file.size)} · PDF</span>
        </span>
        <button type="button" className="icon-button" onClick={clear} disabled={disabled} aria-label="Remove file">
          <XIcon size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`dropzone${dragging ? ' dragging' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <span className="dropzone-icon"><UploadIcon size={26} /></span>
      <p><strong>Drop your resume here</strong> or <span className="link-text">browse</span></p>
      <p className="muted">PDF only · up to {MAX_FILE_MB} MB</p>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden
             onChange={(e) => accept(e.target.files[0])} />
    </div>
  );
}
