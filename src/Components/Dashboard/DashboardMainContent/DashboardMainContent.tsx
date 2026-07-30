import type { FC } from "react";
import TopCard from "../TopCard/TopCard";
import GraphCard from "../CurrentTicketCard/GraphCard/GraphCard";
import TicketClosedCard from "../TicketClosedCard";
import DashboardBarChart from "../DashboardBarChart/DashboardBarChart";
import DashboardDateRangePicker from "../DashboardDatePicker/DashboardDateRangePicker";
import type { DashboardDateRange } from "../DashboardDatePicker/DashboardDateRangePicker";
import DashboardCollectionSummary from "../../../Pages/Dashboard/DashboardCollectionSummary/DashboardCollectionSummary";
import profileSwitch from "../../../assets/icons/profile-switch.svg";
import createdTicketIcon from "../../../assets/icons/created-ticket-white.svg";
import callReportIcon from "../../../assets/icons/call-report-white.svg";
import postponedIcon from "../../../assets/icons/postponed-white.svg";
import type {
  DashboardChartAgent,
  DashboardStats,
} from "../../../Types/dashboard.types";

interface DashboardMainContentProps {
  stats: DashboardStats;
  agentLabel: string;
  agentRole: string;
  selectedDateRange: DashboardDateRange;
  onDateRangeChange: (range: DashboardDateRange) => void;
  formatAmount: (amount: number) => string;
  collectionSummaryAmount: string;
  collectionSummaryData: Array<{
    nPaymode?: number | string;
    nTotalAmount?: number | string;
    nAmount?: number | string;
    Amount?: number | string;
    amount?: number | string;
    TotalAmount?: number | string;
  }>;
  agents: DashboardChartAgent[];
  onAgentClick: () => void;
  onCreatedTicketClick: () => void;
  onCallReportClick: () => void;
  onPostponedClick: () => void;
  onCollectionSummaryClick: () => void;
  onReceiptClick: () => void;
  onBillClick: () => void;
  onClosedClick: (status: "closed" | "resolved" | "unresolved") => void;
  onRefresh: () => void;
}

const DashboardMainContent: FC<DashboardMainContentProps> = ({
  stats,
  agentLabel,
  agentRole,
  selectedDateRange,
  onDateRangeChange,
  formatAmount,
  collectionSummaryAmount,
  collectionSummaryData,
  agents,
  onAgentClick,
  onCreatedTicketClick,
  onCallReportClick,
  onPostponedClick,
  onCollectionSummaryClick,
  onReceiptClick,
  onBillClick,
  onClosedClick,
}) => {
  return (
    <div className="flex w-full flex-col gap-3.5 text-[15px] px-8">
      <div className="flex items-center justify-between gap-3 ">
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <DashboardDateRangePicker
          value={selectedDateRange}
          onChange={onDateRangeChange}
        />
      </div>

      <div className="flex h-10 w-[867px] max-w-full items-center justify-between rounded-md border border-[#83ccff] bg-[#d8eefc] px-3">
        <button
          type="button"
          onClick={onAgentClick}
          className="flex min-w-0 items-center gap-2.5 text-left"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8eccf7] text-sm font-medium text-[#173d59]">
            {(agentLabel?.[0] || "S").toUpperCase()}
          </div>
          <span className="truncate text-xs font-medium text-[#173d59]">
            {agentLabel}{" "}
            <span className="font-normal text-[#73849f]">({agentRole})</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onAgentClick}
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#0797e5] text-white transition-colors hover:bg-[#0788d0]"
          aria-label="Switch agent"
        >
          <img src={profileSwitch} alt="" className="h-[18px] w-[17px]" />
        </button>
      </div>



      <div className="grid grid-cols-1 gap-3.5 rounded-b-none sm:grid-cols-6">
        <div className="h-[74px] w-60 sm:col-span-2">
          <TopCard
            icon={createdTicketIcon}
            label="Created Ticket"
            value={stats.createdTicket}
            iconBg="bg-emerald-500"
            onClick={onCreatedTicketClick}
          />
        </div>
        <div className="h-[74px] w-60 sm:col-span-2">
          <TopCard
            label="Call Report"
            value={stats.callReport}
            icon={callReportIcon}
            iconBg="bg-rose-400"
            onClick={onCallReportClick}
          />
        </div>
        <div className="h-[74px] w-65 sm:col-span-2">
          <TopCard
            label="Postponed"
            value={stats.postponed}
            icon={postponedIcon}
            iconBg="bg-indigo-500"
            onClick={onPostponedClick}
          />
        </div>

        <div className="grid auto-rows-[68px] grid-cols-1 gap-1.5 sm:col-span-6 sm:h-[68px] sm:grid-cols-2">
          <GraphCard
            type="Receipts"
            number={stats.receipts}
            amount={formatAmount(stats.receiptsAmount)}
            onClick={onReceiptClick}
          />
          <GraphCard
            type="Bills"
            number={stats.bills}
            amount={formatAmount(stats.billsAmount)}
            onClick={onBillClick}
          />
        </div>

        <div className="h-[88px] sm:col-span-6">
          <TicketClosedCard
            closed={stats.closed}
            resolved={stats.resolved}
            unresolved={stats.unresolved}
            onClick={onClosedClick}
          />
        </div>

        <div className="sm:col-span-6">
          <DashboardBarChart agents={agents} />
        </div>

        <div className="sm:col-span-6">
          <DashboardCollectionSummary
            amount={collectionSummaryAmount}
            data={collectionSummaryData}
            onClick={onCollectionSummaryClick}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardMainContent;
