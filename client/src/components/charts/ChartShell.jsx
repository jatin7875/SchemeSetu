import ChartCard from "../dashboard/ChartCard.jsx";

function ChartShell({ title, subtitle, data, children }) {
  return (
    <ChartCard title={title} subtitle={subtitle} data={data}>
      {children}
    </ChartCard>
  );
}

export default ChartShell;
