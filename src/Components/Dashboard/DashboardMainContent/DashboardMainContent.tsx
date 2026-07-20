import type { FC } from 'react';
import type { Dayjs } from 'dayjs';
import TopCard from '../TopCard/TopCard';
import GraphCard from '../CurrentTicketCard/GraphCard/GraphCard';
import TicketClosedCard from '../TicketClosedCard';
import DashboardBarChart from '../DashboardBarChart/DashboardBarChart';
import DashboardDatePicker from '../DashboardDatePicker/DashboardDatePicker';
import DashboardCollectionSummary from '../../../Pages/Dashboard/DashboardCollectionSummary/DashboardCollectionSummary';
import profileSwitch from '../../../assets/icons/profile-switch.svg';
import createdTicketIcon from '../../../assets/icons/created-ticket-white.svg';
import callReportIcon from '../../../assets/icons/call-report-white.svg';
import postponedIcon from '../../../assets/icons/postponed-white.svg';
import type { DashboardChartAgent, DashboardStats } from '../../../Types/dashboard.types';

interface DashboardMainContentProps {
  stats: DashboardStats;
  agentLabel: string;
  agentRole: string;
  selectedDate: Dayjs;
  onDateChange: (date: Dayjs) => void;
  formatAmount: (amount: number) => string;
  collectionSummaryAmount: string;
  agents: DashboardChartAgent[];
  onAgentClick: () => void;
  onRefresh: () => void;
}

const DashboardMainContent: FC<DashboardMainContentProps> = ({
  stats,
  agentLabel,
  agentRole,
  selectedDate,
  onDateChange,
  formatAmount,
  collectionSummaryAmount,
  agents,
  onAgentClick,
  onRefresh,
}) => {
  return (
    <div className="flex w-full flex-col gap-3.5 text-[15px]">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
        <DashboardDatePicker
          value={selectedDate}
          onChange={onDateChange}
        />
      </div>

      <div className="flex h-11 items-center justify-between rounded-xl bg-[#D4EEFB] px-4">
        <button
          type="button"
          onClick={onAgentClick}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8ECCF7] text-xs font-semibold text-slate-800">
            {(agentLabel?.[0] || 'S').toUpperCase()}
          </div>
          <span className="truncate text-sm font-medium text-slate-700">
            {agentLabel} <span className="text-xs text-slate-500">{agentRole}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 text-[#1e5b86] hover:bg-white"
          aria-label="Refresh dashboard"
        >
          <img src={profileSwitch} alt="" className="h-4 w-4 brightness-0 invert-[0.2]" />
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-6">
        <div className="h-[80px] sm:col-span-2">
          <TopCard
            label="Created Ticket"
            value={stats.createdTicket}
            icon={createdTicketIcon}
            iconBg="bg-emerald-500"
          />
        </div>
        <div className="h-[80px] sm:col-span-2">
          <TopCard
            label="Call Report"
            value={stats.callReport}
            icon={callReportIcon}
            iconBg="bg-rose-400"
          />
        </div>
        <div className="h-[80px] sm:col-span-2">
          <TopCard
            label="Postponed"
            value={stats.postponed}
            icon={postponedIcon}
            iconBg="bg-indigo-500"
          />
        </div>

        <div className="h-[76px] sm:col-span-3">
          <GraphCard
            type="Receipts"
            number={stats.receipts}
            amount={formatAmount(stats.receiptsAmount)}
          />
        </div>
        <div className="h-[76px] sm:col-span-3">
          <GraphCard
            type="Bills"
            number={stats.bills}
            amount={formatAmount(stats.billsAmount)}
          />
        </div>

        <div className="h-[88px] sm:col-span-6">
          <TicketClosedCard
            closed={stats.closed}
            resolved={stats.resolved}
            unresolved={stats.unresolved}
          />
        </div>

        <div className="sm:col-span-6">
          <DashboardBarChart agents={agents} />
        </div>

        <div className="sm:col-span-6">
          <DashboardCollectionSummary amount={collectionSummaryAmount} />
        </div>
      </div>
    </div>
  );
};

export default DashboardMainContent;
