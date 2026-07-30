import type { FC } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface Props {
  type: string;
  number: number;
  amount: number | string;
  className?: string;
  onClick?: VoidFunction;
}

const chartData = [
  { value: 1 },
  { value: 3 },
  { value: 2 },
  { value: 5 },
  { value: 3 },
  { value: 8 },
];

const WaveChart = () => (
  <div className="absolute bottom-1.5 right-2 h-8 w-12" aria-hidden>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="dashboardWaveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#19B7BC" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#19B7BC" stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="#25B8BC" strokeWidth={1.5} fill="url(#dashboardWaveGradient)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const GraphCard: FC<Props> = ({
  amount,
  number,
  type,
  className = '',
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full cursor-pointer overflow-hidden rounded-md border border-[#AEE4E6] bg-[#E6F4F4] text-left transition-all duration-300 hover:shadow-md active:scale-[0.99] ${className}`}
    >
      <div className="flex h-full w-14 shrink-0 self-stretch items-center justify-center bg-[#55B9BC] text-lg font-medium text-white">
        {String(number || 0).padStart(2, '0')}
      </div>
      <div className="relative flex min-w-0 flex-1 items-center px-4 py-2">
        <div className="min-w-0 pr-14">
          <p className="text-xs font-medium text-[#356666]">{type}</p>
          <p className="mt-0.5 truncate text-xl font-medium leading-none text-[#6B9FA1]">
            Rs. {amount}
          </p>
        </div>
        <WaveChart />
      </div>
    </button>
  );
};

export default GraphCard;
