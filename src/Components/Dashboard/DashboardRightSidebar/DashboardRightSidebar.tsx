import SideStatCard from '../CurrentTicketCard/SideStatCard';
import ongoingImg from '../CurrentTicketCard/assets/ongoing-ticket.png';
import overdueImg from '../CurrentTicketCard/assets/overdue-ticket.png';
import unassignedImg from '../CurrentTicketCard/assets/unassigned-ticket.png';
import upcomingImg from '../CurrentTicketCard/assets/upcoming-ticket.png';
import type { SidePanelStats } from '../../../Types/dashboard.types';

interface DashboardRightSidebarProps {
  sideStats: SidePanelStats;
}

const DashboardRightSidebar: React.FC<DashboardRightSidebarProps> = ({
  sideStats,
}) => {
  return (
    <aside className="flex w-full flex-col gap-4">
      <SideStatCard label="Ongoing" value={sideStats.ongoing} image={ongoingImg} />
      <SideStatCard label="Overdue" value={sideStats.overdue} image={overdueImg} />
      <SideStatCard
        label="Unassigned Tickets"
        value={sideStats.unassigned}
        image={unassignedImg}
      />
      <SideStatCard label="Upcoming" value={sideStats.upcoming} image={upcomingImg} />
    </aside>
  );
};

export default DashboardRightSidebar;
