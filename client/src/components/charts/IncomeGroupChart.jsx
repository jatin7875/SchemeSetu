import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartShell from "./ChartShell.jsx";
import CustomTooltip from "./CustomTooltip.jsx";
import { toSafeArray } from "../../utils/analyticsFormatters.js";

const INCOME_ORDER = [
  "Below Rs 1L",
  "Rs 1L - Rs 2.5L",
  "Rs 2.5L - Rs 5L",
  "Rs 5L - Rs 8L",
  "Above Rs 8L"
];

function IncomeGroupChart({ data }) {
  const sourceData = toSafeArray(data);
  const chartData = INCOME_ORDER.map((group) => {
    const item = sourceData.find((entry) => entry.income_group === group);
    return {
      income_group: group,
      fullName: group,
      count: Number(item?.count) || 0
    };
  });

  return (
    <ChartShell title="Income Group Analysis" subtitle="Applications grouped by annual income band" data={chartData}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 18, right: 28, left: 8, bottom: 52 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="income_group" interval={0} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
          <Tooltip content={<CustomTooltip title="Income group" valueLabel="Applications" />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="count" fill="#374151" radius={[8, 8, 0, 0]} barSize={34}>
            <LabelList dataKey="count" position="top" fill="#334155" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export default IncomeGroupChart;
