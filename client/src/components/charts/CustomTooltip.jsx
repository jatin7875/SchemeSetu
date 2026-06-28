import { formatCount, formatPercentage } from "../../utils/analyticsFormatters.js";

function CustomTooltip({ active, payload, title = "Item", valueLabel = "Count", percentKey = "percentage" }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload || {};
  const displayName = item.fullName || item.name || item.scheme_name || item.category || item.reason || item.state || item.income_group || item.range;
  const value = payload[0]?.value ?? item.count;
  const percentage = item[percentKey];

  return (
    <div className="chart-tooltip">
      <span>{title}</span>
      <strong>{displayName}</strong>
      <p>{valueLabel}: {formatCount(value)}</p>
      {percentage !== undefined && <p>Share: {formatPercentage(percentage)}</p>}
    </div>
  );
}

export default CustomTooltip;
