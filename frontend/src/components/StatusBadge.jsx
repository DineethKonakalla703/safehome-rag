export default function StatusBadge({ children, value = children }) {
  const key = String(value).toLowerCase().replaceAll(' ', '-');
  return <span className={`badge badge-${key}`}><i />{children}</span>;
}

