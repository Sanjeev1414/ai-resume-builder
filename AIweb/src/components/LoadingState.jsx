import { useEffect, useState } from 'react';
import { CheckIcon } from './Icons.jsx';

const STEPS = [
  'Reading your resume',
  'Understanding the job requirements',
  'Matching your skills',
  'Writing improved bullet points',
  'Preparing your report',
];

/** Progress steps advance on a timer - purely visual, the real work happens on the server. */
export default function LoadingState() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => Math.min(i + 1, STEPS.length - 1)), 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card loading-card" aria-live="polite">
      <div className="pulse-ring"><span /></div>
      <h3>Analyzing your resume…</h3>
      <p className="muted">This usually takes 20–60 seconds.</p>
      <ol className="loading-steps">
        {STEPS.map((step, i) => (
          <li key={step} className={i < active ? 'done' : i === active ? 'active' : ''}>
            <span className="loading-dot">{i < active ? <CheckIcon size={14} /> : null}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
