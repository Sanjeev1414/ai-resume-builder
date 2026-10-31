import { useEffect, useState } from 'react';

export function scoreLevel(score) {
  if (score >= 75) return { label: 'Strong match', tone: 'good' };
  if (score >= 50) return { label: 'Partial match', tone: 'ok' };
  return { label: 'Needs work', tone: 'low' };
}

/** Circular score gauge that animates from 0 to the score. */
export default function ScoreRing({ score, size = 160, caption }) {
  const [shown, setShown] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const { label, tone } = scoreLevel(score);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className={`score score-${tone}`} style={{ width: size }}>
      {caption && <span className="score-caption">{caption}</span>}
      <div className="score-gauge" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
          <circle cx="60" cy="60" r={radius} className="score-track" />
          <circle cx="60" cy="60" r={radius} className="score-fill"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - shown / 100)} />
        </svg>
        <div className="score-text">
          <strong>{score}</strong>
          <span>out of 100</span>
        </div>
      </div>
      <span className={`pill pill-${tone}`}>{label}</span>
    </div>
  );
}
