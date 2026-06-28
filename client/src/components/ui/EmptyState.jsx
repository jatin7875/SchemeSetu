function EmptyState({ title = "No data yet", message, action }) {
  return (
    <section className="state-card state-card-empty">
      <h2>{title}</h2>
      <p>{message || "There is nothing to show right now."}</p>
      {action && <div className="state-action">{action}</div>}
    </section>
  );
}

export default EmptyState;
