import { useMemo } from "react";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface CustomerMode {
  key: string | number;
  name: string;
  count: number;
}

interface CustomerTicketChartProps {
  total: number;
  resolved: number;
  unresolved: number;
  modes: CustomerMode[];
}

const CustomerTicketChart = ({
  total,
  resolved,
  unresolved,
  modes,
}: CustomerTicketChartProps) => {
  const resolvedCount = Number(resolved) || 0;
  const unresolvedCount = Number(unresolved) || 0;
  const statusTotal = resolvedCount + unresolvedCount;
  const displayTotal = Number(total) > 0 ? Number(total) : statusTotal;

  const centerTextPlugin = useMemo<Plugin<"doughnut">>(() => ({
    id: "customerTicketCenterText",
    afterDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;

      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#2d6a8c";
      ctx.font = "14px sans-serif";
      ctx.fillText("Total", x, y - 12);
      ctx.font = "700 23px sans-serif";
      ctx.fillText(String(displayTotal), x, y + 14);
      ctx.restore();
    },
  }), [displayTotal]);

  const chartData = useMemo(() => ({
    labels: ["Resolved", "Unresolved"],
    datasets: [
      {
        label: "Tickets",
        data: [resolvedCount, unresolvedCount],
        backgroundColor: ["#19c7a0", "#f58a0a"],
        borderColor: "#ffffff",
        borderWidth: 2,
        hoverOffset: 4,
        weight: 1.2,
      },
      {
        label: "Total",
        data: [displayTotal || 1],
        backgroundColor: ["#e9e1d6"],
        borderColor: "#ffffff",
        borderWidth: 5,
        hoverOffset: 0,
        weight: 1,
      },
    ],
  }), [displayTotal, resolvedCount, unresolvedCount]);

  const chartOptions = useMemo<ChartOptions<"doughnut">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    cutout: "45%",
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (context) => context.datasetIndex === 0,
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}`,
        },
      },
    },
  }), []);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border p-4">
      <h2 className="m-0 text-lg">Attended Tickets</h2>

      {statusTotal > 0 ? (
        <div className="relative mx-auto h-[270px] w-[270px] py-4" role="img" aria-label={`${displayTotal} attended tickets`}>
          <Doughnut data={chartData} options={chartOptions} plugins={[centerTextPlugin]} />
        </div>
      ) : (
        <div className="flex h-[270px] items-center justify-center py-4 text-center text-[#2d6a8c]" role="status" aria-label={`${displayTotal} attended tickets`}>
          <div>
            <div className="text-sm">Total</div>
            <div className="text-[23px] font-bold leading-6">{displayTotal}</div>
          </div>
        </div>
      )}

      <div className="flex gap-4 border-b pb-4 text-sm text-[#2d6a8c]">
        <span className="flex items-center gap-1 rounded bg-slate-50 p-2 text-[#19a98a]"><i className="h-3 w-3 rounded-full bg-[#19c7a0]" />Resolved : {String(resolved).padStart(2, "0")}</span>
        <span className="flex items-center gap-1 rounded bg-slate-50 p-2 text-[#f58a0a]"><i className="h-3 w-3 rounded-full bg-[#f58a0a]" />Unresolved : {String(unresolved).padStart(2, "0")}</span>
      </div>

      <div className="flex w-full overflow-x-auto border-b py-1 text-sm">
        {modes.map((mode, index) => (
          <div key={mode.key} className={`flex min-w-[145px] flex-none items-center gap-3 px-4 py-3 ${index ? "border-l" : ""}`}>
            <span className="text-[#2d6a8c]">▶</span>
            <span className="text-[#2d6a8c]">{mode.name}</span>
            <strong className="ml-auto">: {mode.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomerTicketChart;
