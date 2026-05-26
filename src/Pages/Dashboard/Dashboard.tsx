import { useEffect, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import DashboardMainContent from '../../Components/Dashboard/DashboardMainContent/DashboardMainContent';
import DashboardRightSidebar from '../../Components/Dashboard/DashboardRightSidebar/DashboardRightSidebar';
import type { DashboardStats, SidePanelStats } from '../../Types/dashboard.types';

const defaultStats: DashboardStats = {
  createdTicket: 0,
  callReport: 0,
  postponed: 0,
  closed: 0,
  resolved: 0,
  unresolved: 0,
  receipts: 0,
  receiptsAmount: 0,
  bills: 0,
  billsAmount: 0,
};

const defaultSideStats: SidePanelStats = {
  ongoing: 0,
  overdue: 0,
  unassigned: 5,
  upcoming: 0,
};

const Dashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [userLabel, setUserLabel] = useState('(Self) (Admin)');
  const [stats] = useState<DashboardStats>(defaultStats);
  const [sideStats] = useState<SidePanelStats>(defaultSideStats);

  useEffect(() => {
    const raw = localStorage.getItem('userCredentials');
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      const name = user?.data?.cName || user?.cName || 'User';
      const role = user?.data?.cUserType || user?.cUserType || 'Admin';
      setUserLabel(`(${name}) (${role})`);
    } catch {
      /* keep default */
    }
  }, []);

  const formatAmount = (amount: number) =>
    Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="-m-6 grid h-full min-h-0 grid-cols-[72%_28%] overflow-hidden">
      {/* Middle: scrollable content only */}
      <div className="dashboard-scroll min-w-0 overflow-y-auto overflow-x-hidden p-5 pr-4 transition-all duration-300">
        <div className="mx-auto w-full max-w-[96%] origin-top scale-[1.04]">
          <DashboardMainContent
            stats={stats}
            userLabel={userLabel}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            formatAmount={formatAmount}
          />
        </div>
      </div>

      {/* Right sidebar: 28% of content area */}
      <div className="min-w-0 border-l border-sky-100 bg-gray-50 py-5 pr-5 pl-4">
        <div className="sticky top-0 w-full">
          <DashboardRightSidebar sideStats={sideStats} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
