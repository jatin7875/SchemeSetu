function StatCard({ label, value, helper, accent = "teal", icon = "A" }) {
  return (
    <article className={`dashboard-stat-card accent-${accent}`}>
      <div className="dashboard-stat-header">
        <span className="dashboard-stat-icon" aria-hidden="true">{icon}</span>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {helper && <p>{helper}</p>}
    </article>
  );
}

export default StatCard;
