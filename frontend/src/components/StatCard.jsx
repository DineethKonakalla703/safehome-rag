export default function StatCard({ label, value, icon: Icon, tone = 'blue', helper }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
      <div><p>{label}</p><strong>{value}</strong>{helper && <small>{helper}</small>}</div>
    </article>
  );
}

