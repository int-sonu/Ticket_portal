import type React from "react";
import { useMemo } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
  type Plugin,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type AgentGraphRow = {
  name: string;
  group: string;
  CR: number;
  CT: number;
  closed: number;
  ongoing: number;
};

const GraphLegend = () => (
  <div className="absolute right-4 top-4 flex gap-4">
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 bg-[#839EFF]" />
      <p className="text-xs text-gray-700">Call Report</p>
    </div>
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 bg-[#52E0E0]" />
      <p className="text-xs text-gray-700">Created Ticket</p>
    </div>
  </div>
);

const getMaxValue = (rows: AgentGraphRow[]) =>
  Math.max(1, ...rows.map((item) => Math.max(Number(item.CR) || 0, Number(item.CT) || 0)));

const badgePlugin = (data: AgentGraphRow[]): Plugin<"bar"> => ({
  id: "agent-badge-plugin",
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!chartArea || !xScale) return;

    ctx.save();
    ctx.fillStyle = "#4B8DF8";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    chart.data.labels?.forEach((label, index) => {
      const x = xScale.getPixelForValue(index);
      const y = chartArea.top + 4;
      const firstLetter = String(label ?? "").charAt(0).toUpperCase();

      const size = 22;
      const radius = 5;
      const bx = x - size / 2;
      const by = y - size / 2;

      ctx.beginPath();
      ctx.roundRect(bx, by, size, size, radius);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.fillText(firstLetter, x, y + 1);
      ctx.fillStyle = "#4B8DF8";
    });

    ctx.restore();
  },
});

const AgentActivityGraph: React.FC<{ data: AgentGraphRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () => ({
      labels: data.map((item) => item.name),
      datasets: [
        {
          label: "Call Report",
          data: data.map((item) => Number(item.CR) || 0),
          backgroundColor: "#839EFF",
          borderRadius: 4,
          barPercentage: 0.5,
          categoryPercentage: 0.6,
        },
        {
          label: "Created Ticket",
          data: data.map((item) => Number(item.CT) || 0),
          backgroundColor: "#52E0E0",
          borderRadius: 4,
          barPercentage: 0.5,
          categoryPercentage: 0.6,
        },
      ],
    }),
    [data],
  );

  const maxValue = getMaxValue(data);

  const chartOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 28, right: 12, bottom: 8, left: 8 },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#4F8686",
          bodyColor: "#4F8686",
          borderColor: "#d1d5db",
          borderWidth: 1,
          cornerRadius: 8,
          padding: 10,
          displayColors: true,
          callbacks: {
            title: (items) => items[0]?.label ?? "",
            label: (context) => `${context.dataset.label}: ${context.parsed.y ?? 0}`,
            afterBody: (items) => {
              const row = data[items[0]?.dataIndex ?? 0];
              return [
                `Group: ${row?.group || "-"}`,
                `Closed Tickets: ${row?.closed ?? 0}`,
                `Ongoing Tickets: ${row?.ongoing ?? 0}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#4F8686",
            font: { size: 12, weight: 500 },
            maxRotation: 35,
            minRotation: 35,
            padding: 26,
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxValue,
          grid: {
            color: "#d9e3ea",
            borderDash: [4, 4],
          },
          ticks: {
            color: "#64748b",
            font: { size: 11 },
          },
        },
      },
    }),
    [data, maxValue],
  );

  if (!data.length) {
    return (
      <div className="flex h-[380px] items-center justify-center rounded-xl border border-slate-100 bg-white">
        <p className="text-sm font-medium text-slate-500">No Data Available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <GraphLegend />
      <div className="h-[420px]">
        <Bar data={chartData} options={chartOptions} plugins={[badgePlugin(data)]} />
      </div>
    </div>
  );
};

export default AgentActivityGraph;
