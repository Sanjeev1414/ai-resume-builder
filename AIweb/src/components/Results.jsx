import { useState } from 'react';
import ScoreRing from './ScoreRing.jsx';
import { CheckIcon, CopyIcon, EditIcon, LightbulbIcon, ShieldIcon, XIcon } from './Icons.jsx';

function SkillCard({ title, skills, tone, icon: SkillIcon, emptyText }) {
  return (
    <div className="card">
      <div className="card-title">
        <span className={`card-title-icon tone-${tone}`}><SkillIcon size={18} /></span>
        <h3>{title}</h3>
        <span className="count">{skills.length}</span>
      </div>
      {skills.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <ul className="chips">
          {skills.map((skill) => <li key={skill} className={`chip chip-${tone}`}>{skill}</li>)}
        </ul>
      )}
    </div>
  );
}

function RewriteCard({ rewrite }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(rewrite.improved);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked - nothing to do
    }
  }

  return (
    <div className="rewrite">
      <div className="rewrite-col before">
        <span className="rewrite-label">Before</span>
        <p>{rewrite.original}</p>
      </div>
      <div className="rewrite-col after">
        <span className="rewrite-label">After</span>
        <p>{rewrite.improved}</p>
        <button type="button" className="copy-button" onClick={copy}>
          {copied ? <><CheckIcon size={14} /> Copied</> : <><CopyIcon size={14} /> Copy</>}
        </button>
      </div>
      <p className="rewrite-reason">💡 {rewrite.reason}</p>
    </div>
  );
}

export default function Results({ result }) {
  // Reports saved before ATS checks existed have no atsScore
  const hasAts = result.atsScore != null;
  const atsIssues = result.atsIssues ?? [];

  return (
    <section className="results">
      <div className="card summary-card">
        <div className="score-pair">
          <ScoreRing score={result.matchScore} size={140} caption="Job match" />
          {hasAts && <ScoreRing score={result.atsScore} size={140} caption="ATS score" />}
        </div>
        <div className="summary-text">
          <span className="eyebrow">Match summary</span>
          <p>{result.summary}</p>
          <div className="summary-stats">
            <span><b>{result.matchedSkills.length}</b> keywords matched</span>
            <span><b>{result.missingSkills.length}</b> to add</span>
            {hasAts && <span><b>{atsIssues.length}</b> ATS {atsIssues.length === 1 ? 'issue' : 'issues'}</span>}
            <span><b>{result.bulletRewrites.length}</b> bullets improved</span>
          </div>
        </div>
      </div>

      {hasAts && (
        <div className="card">
          <div className="card-title">
            <span className="card-title-icon tone-ok"><ShieldIcon size={18} /></span>
            <h3>ATS check</h3>
            <span className="count">{atsIssues.length}</span>
          </div>
          {atsIssues.length === 0 ? (
            <p className="ats-ok"><CheckIcon size={18} /> No ATS problems found - this resume should parse cleanly.</p>
          ) : (
            <ul className="ats-issues">
              {atsIssues.map((issue, i) => (
                <li key={i}><span className="ats-dot"><XIcon size={14} /></span><p>{issue}</p></li>
              ))}
            </ul>
          )}
          <p className="ats-note">
            Applicant Tracking Systems (Workday, Greenhouse, Lever…) scan resumes before a recruiter does.
            Use a single column, standard headings and the job's exact keywords.
          </p>
        </div>
      )}

      <div className="grid-2">
        <SkillCard title="Keywords you have" skills={result.matchedSkills} tone="good" icon={CheckIcon}
                   emptyText="No clear matches found." />
        <SkillCard title="Missing keywords" skills={result.missingSkills} tone="low" icon={XIcon}
                   emptyText="Nothing important missing - great job!" />
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon tone-primary"><EditIcon size={18} /></span>
          <h3>Improved bullet points</h3>
        </div>
        {result.bulletRewrites.map((rewrite, i) => <RewriteCard key={i} rewrite={rewrite} />)}
      </div>

      <div className="card">
        <div className="card-title">
          <span className="card-title-icon tone-ok"><LightbulbIcon size={18} /></span>
          <h3>How to improve</h3>
        </div>
        <ol className="tips">
          {result.suggestions.map((tip, i) => (
            <li key={i}><span className="tip-number">{i + 1}</span><p>{tip}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}
