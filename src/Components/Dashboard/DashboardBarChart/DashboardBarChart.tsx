import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type Plugin,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DashboardChartAgent } from '../../../Types/dashboard.types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CALL_REPORT_COLOR = '#6478F0';
const CREATED_TICKET_COLOR = '#5CE0E6';
const GRID_COLOR = '#d1d5db';
const GRID_DASH = [5, 5] as const;
const BADGE_COLOR = '#4B8DF8';

interface DashboardBarChartProps {
  agents?: DashboardChartAgent[];
  className?: string;
}

const defaultAgents: DashboardChartAgent[] = [
  { name: 'Ebin Kuriako', callReport: 0.2, createdTicket: 0.15 },
  { name: 'Akshy', callReport: 0.1, createdTicket: 0.1 },
  { name: 'Basil', callReport: 0.1, createdTicket: 0.15 },
  { name: 'Testing Team', callReport: 0.2, createdTicket: 0.1 },
];

/** Draw dashed horizontal & vertical grid lines */
const dashedGridPlugin: Plugin<'bar'> = {
  id: 'dashedGrid',
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const yScale = scales.y;
    const xScale = scales.x;
    if (!chartArea || !yScale || !xScale) return;

    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([...GRID_DASH]);

    // Horizontal dashed lines
    const yTickCount = yScale.ticks.length;
    for (let i = 0; i < yTickCount; i++) {
      const y = yScale.getPixelForTick(i);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
    }

    // Vertical dashed lines
    const xTickCount = xScale.ticks.length;
    for (let i = 0; i < xTickCount; i++) {
      const x = xScale.getPixelForTick(i);
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
    }

    ctx.restore();
  },
};

/** Draw agent initial badges at the bottom, just above the x-axis labels */
const badgePlugin: Plugin<'bar'> = {
  id: 'agentBadge',
  afterDatasetsDraw(chart) {
    const { ctx, scales, chartArea } = chart;
    const xScale = scales.x;
    if (!xScale || !chartArea) return;

    chart.data.labels?.forEach((label, index) => {
      const name = String(label);
      const letter = name.charAt(0).toUpperCase();
      const x = xScale.getPixelForValue(index);
      // Position badge just above the bottom of the chart area (above x-axis labels)
      const y = chartArea.bottom + 16;

      ctx.save();

      // Draw rounded badge background
      ctx.fillStyle = BADGE_COLOR;
      const size = 22;
      const radius = 5;
      const bx = x - size / 2;
      const by = y - size / 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, size, size, radius);
      ctx.fill();

      // Draw badge letter
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x, y);
      ctx.restore();
    });
  },
};

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({
  agents = defaultAgents,
  className = '',
}) => {
  const chartData = useMemo(
    () => ({
      labels: agents.map((a) => a.name),
      datasets: [
        {
          label: 'Call Report',
          data: agents.map((a) => a.callReport),
          backgroundColor: CALL_REPORT_COLOR,
          borderRadius: 3,
          barPercentage: 0.5,
          categoryPercentage: 0.6,
        },
        {
          label: 'Created Ticket',
          data: agents.map((a) => a.createdTicket),
          backgroundColor: CREATED_TICKET_COLOR,
          borderRadius: 3,
          barPercentage: 0.5,
          categoryPercentage: 0.6,
        },
      ],
    }),
    [agents],
  );

  const options: ChartOptions<'bar'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 8, bottom: 4 },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'rectRounded',
            boxWidth: 10,
            boxHeight: 10,
            padding: 16,
            font: { size: 11, weight: 500 },
            color: '#64748b',
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: '#1e293b',
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          cornerRadius: 6,
          padding: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#64748b',
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 45,
            padding: 24, // Leave space for badge between axis and labels
          },
        },
        y: {
          min: 0,
          max: 4,
          grid: { display: false },
          border: { display: false },
          ticks: {
            stepSize: 1,
            color: '#94a3b8',
            font: { size: 11 },
          },
        },
      },
    }),
    [],
  );

  return (
    <div
      className={`h-[300px] w-full rounded-xl border border-slate-100 bg-white p-4 ${className}`}
    >
      <Bar
        data={chartData}
        options={options}
        plugins={[dashedGridPlugin, badgePlugin]}
      />
    </div>
  );
};

export default DashboardBarChart;
