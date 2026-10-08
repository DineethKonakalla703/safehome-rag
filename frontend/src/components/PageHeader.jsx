export default function PageHeader({ eyebrow, title, subtitle, action, actions, meta }) {
  const actionContent = action || actions;
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {meta && <div className="page-meta">{meta}</div>}
      </div>
      {actionContent && <div className="page-actions">{actionContent}</div>}
    </header>
  );
}

