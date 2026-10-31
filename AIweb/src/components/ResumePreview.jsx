/** ATS-friendly layouts: all single column, standard headings, real text (no images or tables). */
export const TEMPLATES = [
  { value: 'classic', label: 'Classic', description: 'Centered header, navy section rules' },
  { value: 'modern', label: 'Modern', description: 'Left-aligned, teal accents' },
  { value: 'compact', label: 'Compact', description: 'Serif, tighter spacing - fits more on one page' },
];

export const lines = (text) => (text ?? '').split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

/** Converts the AI's tailored resume (lists) into the Resume Builder's form shape (text fields). */
export function toBuilderResume(ai, template = 'classic') {
  const join = (items, separator) => (items ?? []).filter(Boolean).join(separator);
  return {
    fullName: ai.fullName ?? '', title: ai.title ?? '', email: ai.email ?? '', phone: ai.phone ?? '',
    location: ai.location ?? '', linkedin: ai.linkedin ?? '', website: ai.website ?? '', summary: ai.summary ?? '',
    skills: join(ai.skills, ', '),
    experience: (ai.experience ?? []).map((e) => ({ ...e, bullets: join(e.bullets, '\n') })),
    projects: (ai.projects ?? []).map((p) => ({ ...p, bullets: join(p.bullets, '\n') })),
    education: ai.education ?? [],
    certifications: join(ai.certifications, '\n'),
    template,
  };
}

/** Printable resume page in the chosen template. `r` is in the Resume Builder's form shape. */
export default function ResumePreview({ r, template = 'classic' }) {
  const contact = [r.email, r.phone, r.location, r.linkedin, r.website].filter(Boolean);
  return (
    <div className={`resume-paper tpl-${template}`}>
      <h1>{r.fullName || 'Your Name'}</h1>
      {r.title && <p className="rp-title">{r.title}</p>}
      {contact.length > 0 && <p className="rp-contact">{contact.join(' | ')}</p>}

      {r.summary && (<><h2>Summary</h2><p>{r.summary}</p></>)}

      {r.skills && (<><h2>Skills</h2><p>{r.skills}</p></>)}

      {r.experience.some((e) => e.role || e.company) && (
        <>
          <h2>Experience</h2>
          {r.experience.filter((e) => e.role || e.company).map((e, i) => (
            <div key={i} className="rp-item">
              <div className="rp-row"><strong>{e.role}{e.company && `, ${e.company}`}</strong><span>{[e.start, e.end].filter(Boolean).join(' - ')}</span></div>
              {e.location && <p className="rp-sub">{e.location}</p>}
              <ul>{lines(e.bullets).map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
        </>
      )}

      {r.projects.some((p) => p.name) && (
        <>
          <h2>Projects</h2>
          {r.projects.filter((p) => p.name).map((p, i) => (
            <div key={i} className="rp-item">
              <div className="rp-row"><strong>{p.name}{p.tech && ` | ${p.tech}`}</strong><span>{p.link}</span></div>
              <ul>{lines(p.bullets).map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
        </>
      )}

      {r.education.some((e) => e.degree || e.school) && (
        <>
          <h2>Education</h2>
          {r.education.filter((e) => e.degree || e.school).map((e, i) => (
            <div key={i} className="rp-item">
              <div className="rp-row"><strong>{e.degree}{e.school && `, ${e.school}`}</strong><span>{e.year}</span></div>
              {e.score && <p className="rp-sub">{e.score}</p>}
            </div>
          ))}
        </>
      )}

      {lines(r.certifications).length > 0 && (
        <><h2>Certifications</h2><ul>{lines(r.certifications).map((c, i) => <li key={i}>{c}</li>)}</ul></>
      )}
    </div>
  );
}

/** Template choice as a row of buttons. */
export function TemplatePicker({ value, onChange }) {
  return (
    <div className="template-picker" role="radiogroup" aria-label="Resume template">
      {TEMPLATES.map((t) => (
        <button key={t.value} type="button" role="radio" aria-checked={value === t.value}
                className={`template-option${value === t.value ? ' selected' : ''}`} onClick={() => onChange(t.value)}>
          <span className={`template-thumb thumb-${t.value}`} aria-hidden="true"><i /><i /><i /><i /></span>
          <span><strong>{t.label}</strong><small>{t.description}</small></span>
        </button>
      ))}
    </div>
  );
}

/**
 * Prints only this resume (Save as PDF in the print dialog). The page behind it is hidden with
 * display:none so long pages don't add blank sheets, and the title becomes the PDF's file name.
 */
export function printResume(fileName) {
  const previousTitle = document.title;
  document.title = fileName;
  document.body.classList.add('print-isolate');
  const restore = () => {
    document.body.classList.remove('print-isolate');
    document.title = previousTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
}
