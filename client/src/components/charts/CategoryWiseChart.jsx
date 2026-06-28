import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartShell from "./ChartShell.jsx";
import CustomTooltip from "./CustomTooltip.jsx";
import { groupSmallCategories, truncateLabel } from "../../utils/analyticsFormatters.js";

const COLORS = ["#1B4332", "#D97706", "#15803D", "#B45309", "#374151", "#6B7280", "#92400E", "#B91C1C", "#9CA3AF"];

function CategoryWiseChart({ data }) {
  const chartData = groupSmallCategories(data, "category", "count", 8)
    .map((item) => ({
      ...item,
      fullName: item.category,
      shortName: truncateLabel(item.category, 22),
      count: Number(item.count) || 0
    }));
  const total = chartData.reduce((sum, item) => sum + item.count, 0);
  const dataWithPercent = chartData.map((item) => ({
    ...item,
    percentage: total ? (item.count / total) * 100 : 0
  }));
  const chartHeight = Math.max(320, dataWithPercent.length * 48);

  return (
    <ChartShell title="Category-wise Recommendations" subtitle="Top categories, with smaller categories grouped" data={dataWithPercent}>
      {dataWithPercent.length <= 6 ? (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={dataWithPercent}
              dataKey="count"
              nameKey="shortName"
              cx="50%"
              cy="48%"
              innerRadius={68}
              outerRadius={105}
              paddingAngle={3}
            >
              {dataWithPercent.map((entry, index) => (
                <Cell key={entry.fullName} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip title="Category" valueLabel="Recommendations" />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={dataWithPercent} layout="vertical" margin={{ top: 16, right: 42, left: 118, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis
              dataKey="shortName"
              type="category"
              width={136}
              tick={{ fontSize: 12, fill: "#334155" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip title="Category" valueLabel="Recommendations" />} cursor={{ fill: "#f8fafc" }} />
            <Bar dataKey="count" fill="#0f766e" radius={[0, 8, 8, 0]} barSize={24}>
              <LabelList dataKey="count" position="right" fill="#334155" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

export default CategoryWiseChart;
