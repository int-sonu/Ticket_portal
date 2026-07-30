import { useMemo } from 'react';
import type { FC } from 'react';
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

const CALL_REPORT_COLOR = '#7488ff';
const CREATED_TICKET_COLOR = '#45d6d5';
const GRID_COLOR = '#d1d1d1';
const GRID_DASH = [3, 3] as const;
const BADGE_COLOR = '#2f78ff';
const AXIS_COLOR = '#8a8a8a';

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

const dashedGridPlugin: Plugin<'bar'> = {
  id: 'dashedGrid',
  beforeDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const yScale = scales.y;
    const xScale = scales.x;
    if (!chartArea || !yScale || !xScale) return;

    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.setLineDash([...GRID_DASH]);

    const yTickCount = yScale.ticks.length;
    for (let i = 1; i < yTickCount; i++) {
      const y = yScale.getPixelForTick(i);
      ctx.beginPath();
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();
    }

    const verticalLines: number[] = [];
    const xTickCount = xScale.ticks.length;
    for (let i = 0; i < xTickCount; i++) {
      verticalLines.push(xScale.getPixelForTick(i));
    }
    verticalLines.push(chartArea.right);

    verticalLines.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
    });

    ctx.restore();
  },
};

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
      const y = chartArea.bottom - 21;

      ctx.save();

      ctx.fillStyle = BADGE_COLOR;
      const size = 24;
      const radius = 6;
      const bx = x - size / 2;
      const by = y - size / 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, size, size, radius);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x, y);
      ctx.restore();
    });
  },
};

const DashboardBarChart: FC<DashboardBarChartProps> = ({
  agents = defaultAgents,
  className = '',
}) => {
  const maxDataValue = Math.max(
    4,
    ...agents.flatMap((agent) => [Number(agent.callReport) || 0, Number(agent.createdTicket) || 0]),
  );

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
        padding: { top: 4, right: 12, bottom: 0, left: 2 },
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: false,
            boxWidth: 16,
            boxHeight: 16,
            padding: 8,
            font: { size: 13, weight: 400 },
            color: '#3e4665',
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
          border: { display: true, color: AXIS_COLOR, width: 1 },
          ticks: {
            color: '#526d79',
            font: { size: 13 },
            maxRotation: 45,
            minRotation: 45,
            padding: 8,
          },
        },
        y: {
          min: 0,
          suggestedMax: maxDataValue,
          grid: { display: false },
          border: { display: true, color: AXIS_COLOR, width: 1 },
          ticks: {
            stepSize: 1,
            color: '#666666',
            font: { size: 16 },
            padding: 7,
          },
        },
      },
    }),
    [maxDataValue],
  );

  return (
    <div
      className={`h-[410px] w-full bg-white px-3 pb-1 pt-2 ${className}`}
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
