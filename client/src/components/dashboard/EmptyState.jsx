function EmptyState({ title, message }) {
  return (
    <div className="dashboard-empty">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;
