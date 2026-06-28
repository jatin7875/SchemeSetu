import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartShell from "./ChartShell.jsx";
import CustomTooltip from "./CustomTooltip.jsx";
import { toSafeArray } from "../../utils/analyticsFormatters.js";

const COLORS = ["#B91C1C", "#D97706", "#B45309", "#15803D"];

function MatchDistributionChart({ data }) {
  const sourceData = toSafeArray(data).map((item) => ({
    ...item,
    fullName: item.range,
    count: Number(item.count) || 0
  }));
  const total = sourceData.reduce((sum, item) => sum + item.count, 0);
  const chartData = sourceData.map((item) => ({
    ...item,
    percentage: total ? (item.count / total) * 100 : 0
  }));

  return (
    <ChartShell title="Scheme Match Distribution" subtitle="Recommendation counts by final score range" data={chartData}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="range"
            cx="50%"
            cy="48%"
            innerRadius={68}
            outerRadius={105}
            paddingAngle={4}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.range} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip title="Score range" valueLabel="Recommendations" />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default MatchDistributionChart;
