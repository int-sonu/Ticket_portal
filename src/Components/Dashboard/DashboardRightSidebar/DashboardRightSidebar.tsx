import type { FC } from 'react';
import SideStatCard from '../CurrentTicketCard/SideStatCard';
import ongoingImg from '../CurrentTicketCard/assets/ongoing-ticket.png';
import overdueImg from '../CurrentTicketCard/assets/overdue-ticket.png';
import unassignedImg from '../CurrentTicketCard/assets/unassigned-ticket.png';
import upcomingImg from '../CurrentTicketCard/assets/upcoming-ticket.png';
import type { SidePanelStats } from '../../../Types/dashboard.types';

interface DashboardRightSidebarProps {
  sideStats: SidePanelStats;
  onOngoingClick: () => void;
  onOverdueClick: () => void;
  onUnassignedClick: () => void;
  onUpcomingClick: () => void;
}

const DashboardRightSidebar: FC<DashboardRightSidebarProps> = ({
  sideStats,
  onOngoingClick,
  onOverdueClick,
  onUnassignedClick,
  onUpcomingClick,
}) => {
  return (
    <aside className="flex w-full flex-col gap-4">
      <SideStatCard label="Ongoing" value={sideStats.ongoing} image={ongoingImg} onClick={onOngoingClick} />
      <SideStatCard label="Overdue" value={sideStats.overdue} image={overdueImg} onClick={onOverdueClick} />
      <SideStatCard
        label="Unassigned Tickets"
        value={sideStats.unassigned}
        image={unassignedImg}
        onClick={onUnassignedClick}
      />
      <SideStatCard label="Upcoming" value={sideStats.upcoming} image={upcomingImg} onClick={onUpcomingClick} />
    </aside>
  );
};

export default DashboardRightSidebar;
