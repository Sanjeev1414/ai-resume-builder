import { useEffect, useRef, useState } from 'react';
import { AuthError, runCode } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { htmlPreviewDoc, reactPreviewDoc, runSql } from '../compilerRunners.js';
import { SQL_TABLES } from '../data/interviewTopics.js';
import { CopyIcon, PlayIcon, RefreshIcon, TerminalIcon } from './Icons.jsx';

const MAX_CONSOLE_LINES = 200;
// Unsaved code per topic, kept while the user moves between pages (cleared on reload)
const drafts = {};

function SqlResult({ table }) {
  return (
    <div className="ide-table-wrap">
      <table className="ide-table">
        <thead><tr>{table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {table.values.map((row, r) => (
            <tr key={r}>{row.map((cell, c) => <td key={c} className={cell === null ? 'ide-null' : ''}>{cell === null ? 'NULL' : String(cell)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      <small>{table.values.length} {table.values.length === 1 ? 'row' : 'rows'}</small>
    </div>
  );
}

function ServerResult({ result }) {
  const empty = !result.compileError && !result.stdout && !result.stderr;
  const failed = result.status !== '0' || Boolean(result.signal);
  return (
    <>
      {result.compileError && <pre className="ide-text ide-error">{result.compileError}</pre>}
      {result.stdout && <pre className="ide-text">{result.stdout}</pre>}
      {result.stderr && <pre className="ide-text ide-error">{result.stderr}</pre>}
      {empty && <p className="ide-placeholder">The program finished with no output.</p>}
      <small className={failed ? 'ide-status ide-status-bad' : 'ide-status'}>
        {result.signal ? `Stopped: ${result.signal}` : `Exit code ${result.status || 'unknown'}`}
      </small>
    </>
  );
}

/** Editor and output panel. Java and Python run through the backend, everything else in the browser. */
export default function CodeCompiler({ draftKey, topic, sample, languages, language, onLanguageChange }) {
  const { handleAuthError, showToast } = useAuth();
  const [code, setCode] = useState(drafts[draftKey] ?? topic.starter);
  const [stdin, setStdin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [serverResult, setServerResult] = useState(null);
  const [sqlResult, setSqlResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [consoleLines, setConsoleLines] = useState([]);
  const frame = useRef(null);
  const gutter = useRef(null);
  const editor = useRef(null);
  const previewRuns = useRef(0);

  const isPreview = topic.runner === 'preview' || topic.runner === 'react';
  const isServer = topic.runner === 'java' || topic.runner === 'python';
  const lineCount = code.split('\n').length;

  function changeCode(next) {
    drafts[draftKey] = next;
    setCode(next);
  }

  async function run(source = code) {
    setError('');
    if (isPreview) {
      previewRuns.current += 1;
      setConsoleLines([]);
      setPreview({
        run: previewRuns.current,
        doc: topic.runner === 'react' ? reactPreviewDoc(source) : htmlPreviewDoc(source),
      });
      return;
    }
    setBusy(true);
    try {
      if (isServer) setServerResult(await runCode({ language: topic.runner, code: source, stdin }));
      else setSqlResult(await runSql(source));
    } catch (err) {
      setServerResult(null);
      setSqlResult(null);
      if (err instanceof AuthError) handleAuthError(err);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // "Open in compiler" on a question. Runs right away unless that would use the backend.
  useEffect(() => {
    if (!sample) return;
    changeCode(sample.code);
    setServerResult(null);
    setError('');
    if (!isServer) run(sample.code);
    editor.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample]);

  // Show something straight away on the live preview pages
  useEffect(() => {
    if (isPreview && !sample) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPreview) return undefined;
    function onMessage(event) {
      // Only listen to our own preview frame, and only ever treat its message as text
      if (event.source !== frame.current?.contentWindow || event.data?.source !== 'iq-preview') return;
      setConsoleLines((lines) => [...lines, { level: event.data.level, text: String(event.data.text) }].slice(-MAX_CONSOLE_LINES));
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [isPreview]);

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!busy) run();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: start, selectionEnd: end } = e.target;
      changeCode(`${code.slice(0, start)}    ${code.slice(end)}`);
      requestAnimationFrame(() => {
        editor.current.selectionStart = start + 4;
        editor.current.selectionEnd = start + 4;
      });
    }
  }

  function reset() {
    changeCode(topic.starter);
    setServerResult(null);
    setSqlResult(null);
    setError('');
    if (isPreview) run(topic.starter);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Code copied', 'Paste it wherever you need it.');
    } catch {
      setError('Your browser blocked copying. Please select the code and copy it by hand.');
    }
  }

  const hasOutput = serverResult || sqlResult;

  return (
    <section className="ide" aria-label={`${topic.name} online compiler`}>
      <div className="ide-bar">
        <span className="ide-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="ide-file">{topic.fileName}</span>
        {languages && (
          <div className="ide-languages" role="group" aria-label="Language">
            {Object.entries(languages).map(([key, option]) => (
              <button key={key} type="button" className={key === language ? 'active' : ''}
                      aria-pressed={key === language} onClick={() => onLanguageChange(key)}>
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="ide-actions">
          <button type="button" className="ide-icon" onClick={copy} title="Copy code" aria-label="Copy code"><CopyIcon size={16} /></button>
          <button type="button" className="ide-icon" onClick={reset} title="Reset to starter code" aria-label="Reset to starter code"><RefreshIcon size={16} /></button>
          <button type="button" className="ide-run" onClick={() => run()} disabled={busy} title="Run (Ctrl + Enter)">
            {busy ? <span className="spinner" aria-hidden="true" /> : <PlayIcon size={15} />}
            {busy ? 'Running' : 'Run'}
          </button>
        </div>
      </div>

      <div className="ide-editor">
        <div className="ide-gutter" ref={gutter} aria-hidden="true">
          {Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}
        </div>
        <textarea
          ref={editor}
          value={code}
          onChange={(e) => changeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(e) => { gutter.current.scrollTop = e.target.scrollTop; }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label={`${topic.name} code`}
        />
      </div>

      {isServer && (
        <details className="ide-stdin">
          <summary>Program input (stdin)</summary>
          <textarea rows={2} value={stdin} onChange={(e) => setStdin(e.target.value)} maxLength={10000}
                    spellCheck={false} placeholder="Values your program reads, one per line" aria-label="Program input" />
        </details>
      )}

      {topic.runner === 'sql' && (
        <div className="ide-schema">
          {SQL_TABLES.map((t) => <span key={t.name}><b>{t.name}</b> ({t.columns})</span>)}
        </div>
      )}

      <div className="ide-output">
        <div className="ide-output-head">
          <TerminalIcon size={15} />
          <span>{isPreview ? 'Live preview' : topic.runner === 'sql' ? 'Query result' : 'Output'}</span>
        </div>

        {isPreview ? (
          <>
            {/* No allow-same-origin: code in this frame can't read the app's sign-in token */}
            {preview && (
              <iframe key={preview.run} ref={frame} className="ide-preview" title={`${topic.name} preview`}
                      sandbox="allow-scripts allow-modals" srcDoc={preview.doc} />
            )}
            {consoleLines.length > 0 && (
              <pre className="ide-text ide-console">
                {consoleLines.map((line, i) => <span key={i} className={line.level === 'log' ? '' : 'ide-error'}>{line.text}{'\n'}</span>)}
              </pre>
            )}
          </>
        ) : (
          <div className="ide-result" aria-live="polite">
            {busy && <p className="ide-placeholder">{isServer ? 'Compiling and running. The first run can take a minute while the server wakes up…' : 'Running…'}</p>}
            {!busy && error && <pre className="ide-text ide-error">{error}</pre>}
            {!busy && !error && !hasOutput && <p className="ide-placeholder">Press Run or Ctrl + Enter to see the result here.</p>}
            {!busy && !error && serverResult && <ServerResult result={serverResult} />}
            {!busy && !error && sqlResult && (
              sqlResult.tables.length > 0
                ? sqlResult.tables.map((table, i) => <SqlResult key={i} table={table} />)
                : <p className="ide-placeholder">Query OK. {sqlResult.changes} {sqlResult.changes === 1 ? 'row' : 'rows'} changed.</p>
            )}
          </div>
        )}
      </div>

      <p className="ide-note">
        {isServer && 'Runs on Wandbox, a free online compiler. Your code is sent there, so do not paste passwords or private data.'}
        {topic.runner === 'sql' && 'SQLite runs in your browser. The sample tables reset on every run.'}
        {isPreview && 'Runs in your browser in a secure sandbox.'}
      </p>
    </section>
  );
}
