function ChartCard({
  title,
  subtitle,
  data,
  children,
  isEmpty,
  emptyMessage = "Submit citizen profiles to generate insights."
}) {
  const hasData = Array.isArray(data) && data.some((item) => Number(item.count) > 0);
  const noData = isEmpty ?? !hasData;

  return (
    <section className="chart-card">
      <div className="chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {noData ? (
        <div className="empty-chart">
          <strong>No analytics data yet</strong>
          <span>{emptyMessage}</span>
        </div>
      ) : children}
    </section>
  );
}

export default ChartCard;
