import { useEffect } from 'react';

/** Sets the browser tab title, e.g. "History · ResumeAI". */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ResumeAI` : 'ResumeAI - AI Resume Analyzer';
  }, [title]);
}
