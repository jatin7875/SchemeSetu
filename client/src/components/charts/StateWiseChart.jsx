import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartShell from "./ChartShell.jsx";
import CustomTooltip from "./CustomTooltip.jsx";
import { toSafeArray } from "../../utils/analyticsFormatters.js";

function StateWiseChart({ data }) {
  const chartData = toSafeArray(data)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      fullName: item.state,
      count: Number(item.count) || 0
    }));

  return (
    <ChartShell title="State-wise Applications" subtitle="Top 10 states by submitted profile count" data={chartData}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 18, right: 28, left: 8, bottom: 42 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="state" interval={0} tick={{ fontSize: 12, fill: "#334155" }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip content={<CustomTooltip title="State" valueLabel="Applications" />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="count" fill="#16a34a" radius={[8, 8, 0, 0]} barSize={34}>
            <LabelList dataKey="count" position="top" fill="#334155" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default StateWiseChart;
