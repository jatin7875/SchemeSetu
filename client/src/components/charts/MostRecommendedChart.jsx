import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartShell from "./ChartShell.jsx";
import CustomTooltip from "./CustomTooltip.jsx";
import { truncateLabel, toSafeArray } from "../../utils/analyticsFormatters.js";

function MostRecommendedChart({ data }) {
  const chartData = toSafeArray(data)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      fullName: item.scheme_name,
      shortName: truncateLabel(item.scheme_name, 22),
      count: Number(item.count) || 0
    }));
  const chartHeight = Math.max(320, chartData.length * 48);

  return (
    <ChartShell title="Most Recommended Schemes" subtitle="Top 8 schemes by recommendation count" data={chartData}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 16, right: 42, left: 120, bottom: 12 }}>
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
          <Tooltip content={<CustomTooltip title="Scheme" valueLabel="Recommendations" />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="count" fill="#1B4332" radius={[0, 8, 8, 0]} barSize={24}>
            <LabelList dataKey="count" position="right" fill="#334155" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default MostRecommendedChart;
