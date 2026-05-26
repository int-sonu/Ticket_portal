import React from 'react';

interface DashboardCollectionSummaryProps {
  amount?: string;
  className?: string;
}

const DashboardCollectionSummary: React.FC<DashboardCollectionSummaryProps> = ({
  amount = '₹ 0.00',
  className = '',
}) => {
  return (
    <div
      className={`w-full bg-white rounded-xl border border-slate-100 p-5 flex flex-col gap-5 min-h-[240px] shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-[15px] tracking-wide">
          Collection Summary
        </h3>
        <span className="font-bold text-amber-600 text-[16px]">{amount}</span>
      </div>
      <div className="flex-1 flex items-center justify-center rounded-xl bg-slate-50/30 border border-dashed border-slate-200/60 min-h-[160px]">
        <span className="text-amber-600 font-semibold text-sm tracking-wider">
          No Data Available
        </span>
      </div>
    </div>
  );
};

export default DashboardCollectionSummary;
