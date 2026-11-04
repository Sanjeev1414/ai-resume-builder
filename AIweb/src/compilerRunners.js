// Browser-side runners for the compiler: SQL runs on SQLite (WebAssembly), HTML/CSS/React in a sandboxed iframe.
// Java and Python go through the backend (runCode in api.js).
import { SQL_SEED } from './data/interviewTopics.js';

let sqlEngine;

/** Runs the query on fresh sample tables. sql.js is only downloaded the first time someone runs SQL. */
export async function runSql(query) {
  if (!sqlEngine) {
    sqlEngine = Promise.all([
      import('sql.js/dist/sql-wasm.js'),
      import('sql.js/dist/sql-wasm.wasm?url'),
    ]).then(([sql, wasm]) => sql.default({ locateFile: () => wasm.default }));
    sqlEngine.catch(() => { sqlEngine = undefined; });
  }
  const SQL = await sqlEngine;
  const db = new SQL.Database();
  try {
    db.run(SQL_SEED);
    const tables = db.exec(query);
    return { tables, changes: db.getRowsModified() };
  } finally {
    db.close();
  }
}

// Sends console output and errors from the preview to the output panel.
const CONSOLE_BRIDGE = `<script>(function () {
  function send(level, parts) {
    parent.postMessage({ source: 'iq-preview', level: level, text: parts.map(function (p) {
      if (typeof p === 'string') return p;
      try { return JSON.stringify(p); } catch (e) { return String(p); }
    }).join(' ') }, '*');
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      send(level === 'info' ? 'log' : level, Array.prototype.slice.call(arguments));
      original.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (e) {
    if (e.target && e.target.src) send('error', ['Could not load ' + e.target.src]);
    else send('error', [e.message]);
  }, true);
})();<\/script>`;

/** Page for the HTML and CSS preview: the user's own markup plus the console bridge. */
export function htmlPreviewDoc(markup) {
  if (/<head[^>]*>/i.test(markup)) return markup.replace(/<head[^>]*>/i, (head) => head + CONSOLE_BRIDGE);
  // Keep a leading doctype first, otherwise the page would render in quirks mode
  const doctype = markup.match(/^\s*<!doctype[^>]*>/i)?.[0] ?? '';
  return doctype + CONSOLE_BRIDGE + markup.slice(doctype.length);
}

const REACT_SCRIPTS = [
  'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.26.4/babel.min.js',
];

/** Page that compiles the JSX in the iframe and renders the user's App component. */
export function reactPreviewDoc(source) {
  const program = source
    // React and its hooks are already in scope, so imports people paste from real projects are dropped
    .replace(/^\s*import\s[\s\S]*?from\s+['"][^'"]*['"];?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]*['"];?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+(function|class)\b/gm, '$1')
    .replace(/^\s*export\s+default\s+\w+;?\s*$/gm, '')
    .replace(/^(\s*)export\s+(const|let|var|function|class)\b/gm, '$1$2');
  // < stops code containing "</script>" from ending this script tag early
  const encoded = JSON.stringify(program).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8">
<style>body { margin: 16px; font-family: system-ui, sans-serif; color: #0f1b33; }</style>
${CONSOLE_BRIDGE}
${REACT_SCRIPTS.map((src) => `<script src="${src}"><\/script>`).join('\n')}
</head><body><div id="root"></div><script>
var source = ${encoded};
var compiled = Babel.transform(source, { presets: ['react'] }).code;
if (!/\\b(function|class)\\s+App\\b|\\b(const|let|var)\\s+App\\b/.test(source)) {
  console.error('Define a component named App. It is what gets rendered.');
} else {
  new Function(
    'var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo,'
    + ' useCallback = React.useCallback, useContext = React.useContext, useReducer = React.useReducer,'
    + ' createContext = React.createContext, memo = React.memo;\\n'
    + compiled
    + '\\nReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));'
  )();
}
<\/script></body></html>`;
}
