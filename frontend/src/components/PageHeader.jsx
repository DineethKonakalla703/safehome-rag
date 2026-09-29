export default function PageHeader({ eyebrow, title, subtitle, action, meta }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {meta && <div className="page-meta">{meta}</div>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

