export default function StatCard({ label, value, helper, icon, color }) {
  return (
    <article className={`stat-card ${color ? `stat-card-${color}` : ''}`}>
      <div className="stat-card-header">
        <span>{label}</span>
        {icon && <div className={`stat-card-icon ${color ? `icon-${color}` : ''}`}>{icon}</div>}
      </div>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}
