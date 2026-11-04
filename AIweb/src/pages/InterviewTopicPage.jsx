import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import CodeCompiler from '../components/CodeCompiler.jsx';
import { ChevronIcon, DownloadIcon, LinkIcon, PlayIcon } from '../components/Icons.jsx';
import { printResume } from '../components/ResumePreview.jsx';
import { LEVELS, TOPICS } from '../data/interviewTopics.js';
import NotFoundPage from './NotFoundPage.jsx';

function QuestionCard({ item, number, sampleCode, onOpenCode }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={open ? 'qa open' : 'qa'}>
      <button type="button" className="qa-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="qa-number">{number}</span>
        <span className="qa-text">
          <span className={`qa-tag tag-${item.level.toLowerCase()}`}>{item.level}</span>
          <strong>{item.q}</strong>
        </span>
        <ChevronIcon size={20} className="qa-chevron" />
      </button>
      {open && (
        <div className="qa-body">
          <p className="iq-answer">{item.a}</p>
          {sampleCode && <pre className="iq-code"><code>{sampleCode}</code></pre>}
          <div className="iq-card-actions">
            {sampleCode && (
              <button type="button" className="button button-ghost iq-try" onClick={() => onOpenCode(sampleCode)}>
                <PlayIcon size={15} /> Open in compiler
              </button>
            )}
            {item.link && (
              <a className="button button-ghost iq-try" href={item.link} target="_blank" rel="noreferrer">
                <LinkIcon size={15} /> Solve on {item.link.includes('hackerrank') ? 'HackerRank' : 'LeetCode'}
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Hidden on screen. Only this part is printed when the user chooses Download PDF. */
function PrintableQuestions({ topic, withAnswers, sampleCodeFor }) {
  return (
    <div className="print-root iq-print">
      <h1>{topic.name} Interview Questions</h1>
      <p className="iq-print-sub">{topic.subtitle} · {topic.questions.length} questions</p>
      <ol>
        {topic.questions.map((item) => (
          <li key={item.q}>
            <h2>{item.q} <small>{item.level}</small></h2>
            {item.link && <p className="iq-print-link">{item.link}</p>}
            {withAnswers && <p>{item.a}</p>}
            {withAnswers && sampleCodeFor(item) && <pre>{sampleCodeFor(item)}</pre>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function TopicView({ topicKey, topic }) {
  const levels = topic.levels ?? LEVELS;
  const [level, setLevel] = useState('All');
  const [withAnswers, setWithAnswers] = useState(true);
  const [sample, setSample] = useState(null);
  const [language, setLanguage] = useState(topic.languages ? Object.keys(topic.languages)[0] : null);
  const compilerArea = useRef(null);

  // Topics with a language choice (DSA) use the settings of the chosen language
  const compilerTopic = language ? { ...topic, ...topic.languages[language] } : topic;
  const sampleCodeFor = (item) => (language === 'python' ? item.python : item.code);

  function chooseLanguage(next) {
    setSample(null);
    setLanguage(next);
  }

  function openCode(code) {
    setSample({ code });
    // On small screens the compiler sits below the questions
    if (window.matchMedia('(max-width: 1100px)').matches) {
      compilerArea.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const visible = level === 'All' ? topic.questions : topic.questions.filter((q) => q.level === level);

  return (
    <div className="iq-page">
      <div className="iq-hero">
        <div>
          <span className="iq-eyebrow">Interview Preparation</span>
          <h2>{topic.name}</h2>
          <p>{topic.subtitle}</p>
        </div>
        <div className="iq-download">
          <label className="iq-check">
            <input type="checkbox" checked={withAnswers} onChange={(e) => setWithAnswers(e.target.checked)} />
            Include answers
          </label>
          <button type="button" className="button iq-download-button"
                  onClick={() => printResume(`${topic.name} Interview Questions`)}>
            <DownloadIcon size={18} /> Download PDF
          </button>
          <small>Choose "Save as PDF" in the print window.</small>
        </div>
      </div>

      <div className="iq-grid">
        <div className="card iq-questions">
          <div className="filter-tabs" role="tablist" aria-label="Filter by level">
            {levels.map((l) => (
              <button key={l} type="button" role="tab" aria-selected={level === l}
                      className={level === l ? 'active' : ''} onClick={() => setLevel(l)}>
                {l} <span>{l === 'All' ? topic.questions.length : topic.questions.filter((q) => q.level === l).length}</span>
              </button>
            ))}
          </div>
          <ol className="qa-list">
            {visible.map((item) => (
              <QuestionCard key={item.q} item={item} number={topic.questions.indexOf(item) + 1}
                            sampleCode={sampleCodeFor(item)} onOpenCode={openCode} />
            ))}
          </ol>
        </div>

        <div className="iq-compiler" ref={compilerArea}>
          <CodeCompiler key={language ?? topicKey} draftKey={language ? `${topicKey}:${language}` : topicKey}
                        topic={compilerTopic} sample={sample}
                        languages={topic.languages} language={language} onLanguageChange={chooseLanguage} />
        </div>
      </div>

      <PrintableQuestions topic={topic} withAnswers={withAnswers} sampleCodeFor={sampleCodeFor} />
    </div>
  );
}

/** /interview/:topic - common questions for one technology beside an online compiler. */
export default function InterviewTopicPage() {
  const { topic: topicKey } = useParams();
  const topic = Object.hasOwn(TOPICS, topicKey) ? TOPICS[topicKey] : null;
  useDocumentTitle(topic ? `${topic.name} Interview Preparation` : 'Page not found');

  if (!topic) return <NotFoundPage />;
  // The key resets filters and loaded samples when moving to another topic
  return <TopicView key={topicKey} topicKey={topicKey} topic={topic} />;
}
