export default function StatCard({ label, value, icon: Icon, tone = 'blue', helper }) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div className="stat-copy"><p>{label}</p><strong>{value}</strong>{helper && <small>{helper}</small>}</div>
      <span className="stat-accent" />
    </article>
  );
}

