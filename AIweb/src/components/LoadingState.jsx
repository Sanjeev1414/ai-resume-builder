import { useEffect, useState } from 'react';
import { ChartIcon, CheckIcon, EditIcon, FileIcon, SparkleIcon, TargetIcon } from './Icons.jsx';

const STEPS = [
  { label: 'Reading your resume', detail: 'Extracting experience, projects and skills', icon: FileIcon },
  { label: 'Understanding the job', detail: 'Finding the must-have keywords', icon: TargetIcon },
  { label: 'Matching your skills', detail: 'Scoring fit and ATS readability', icon: ChartIcon },
  { label: 'Improving bullet points', detail: 'Rewriting with strong action verbs', icon: EditIcon },
  { label: 'Preparing your report', detail: 'Putting it all together', icon: SparkleIcon },
];

const TIPS = [
  'Most resumes are screened by an ATS before a recruiter ever reads them.',
  'Using the exact wording from the job post helps the ATS rank you higher.',
  'Bullets with numbers ("cut load time by 40%") stand out to recruiters.',
  'A simple single-column layout is the safest format for ATS parsing.',
  'Tailoring your resume to each job can double your interview chances.',
];

const STEP_SECONDS = 7;
const EXPECTED_SECONDS = 40;

/** Progress advances on a timer - purely visual, the real work happens on the server. */
export default function LoadingState() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const active = Math.min(Math.floor(seconds / STEP_SECONDS), STEPS.length - 1);
  // Eases towards 95% so the bar never claims to be finished before the server is
  const progress = Math.round(95 * (1 - Math.exp(-seconds / (EXPECTED_SECONDS / 2.2))));
  const tip = TIPS[Math.floor(seconds / 6) % TIPS.length];

  return (
    <div className="card analyzing" aria-live="polite" aria-busy="true">
      <div className="analyzing-visual" aria-hidden="true">
        <div className="scan-doc">
          <span className="scan-avatar" />
          <span className="scan-line w70 strong" />
          <span className="scan-line w45" />
          <span className="scan-gap" />
          <span className="scan-line w90" />
          <span className="scan-line w80" />
          <span className="scan-line w85" />
          <span className="scan-gap" />
          <span className="scan-line w60 strong" />
          <span className="scan-line w90" />
          <span className="scan-line w75" />
          <div className="scan-chips"><i /><i /><i /></div>
          <span className="scan-beam" />
        </div>
        <span className="scan-spark s1"><SparkleIcon size={18} /></span>
        <span className="scan-spark s2"><SparkleIcon size={14} /></span>
        <span className="scan-spark s3"><SparkleIcon size={22} /></span>
        <div className="scan-score">
          <strong>{progress}%</strong>
          <span>analysed</span>
        </div>
      </div>

      <div className="analyzing-body">
        <span className="eyebrow">AI analysis in progress</span>
        <h2>Analyzing your resume…</h2>
        <p className="muted">Usually takes 20–60 seconds · <span className="elapsed">{seconds}s elapsed</span></p>

        <div className="analyzing-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span style={{ width: `${progress}%` }} />
        </div>

        <ol className="analyzing-steps">
          {STEPS.map(({ label, detail, icon: StepIcon }, i) => {
            const state = i < active ? 'done' : i === active ? 'active' : 'todo';
            return (
              <li key={label} className={state}>
                <span className="step-badge">{state === 'done' ? <CheckIcon size={16} /> : <StepIcon size={16} />}</span>
                <span className="step-text">
                  <strong>{label}</strong>
                  <small>{state === 'done' ? 'Done' : detail}</small>
                </span>
              </li>
            );
          })}
        </ol>

        <div className="analyzing-tip" key={tip}>
          <SparkleIcon size={16} /> <span><strong>Tip:</strong> {tip}</span>
        </div>
      </div>
    </div>
  );
}
