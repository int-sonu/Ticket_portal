import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import Banner from './Banner';
import { usePermissions } from './PermissionContext';

import dashbaordIcon from '../../assets/icons/dashbaordIcon.svg';
import masterIcon from '../../assets/icons/masterIcon.svg';
import ticketIcon from '../../assets/icons/ticketIcon.svg';
import callReportIcon from '../../assets/icons/callReportIcon.svg';
import ItemRepairIcon from '../../assets/icons/ItemRepairIcon.svg';
import moreIcon from '../../assets/icons/moreIcon.svg';
import reportsIcon from '../../assets/icons/reports-icon.svg';
import settingsIcon from '../../assets/icons/settingsIcon.svg';
import billsreceipts from '../../assets/icons/bills&receipts.svg';

interface SidebarProps {
  isSidebarOpen: boolean;
  isMobile?: boolean;
  onNavigate?: () => void;
}

interface SubMenuItem {
  name: string;
  path: string;
  permission: string;
}

interface MenuItem {
  name: string;
  path?: string;
  icon: string;
  permission: string;
  subItems?: SubMenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  isMobile = false,
  onNavigate,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);
  const { loading: permissionsLoading, canAccessModule } = usePermissions();

  const masterSubItems = [
    { name: 'Agent Group', path: '/masters/agent-group', permission: 'master.agent-group' },
    { name: 'Agent', path: '/masters/agent', permission: 'master.agent' },
    { name: 'Trip Mode', path: '/masters/trip-mode', permission: 'master.trip-mode' },
    { name: 'Follow Up Mode', path: '/masters/follow-up-mode', permission: 'master.follow-up-mode' },
    { name: 'Financial Year', path: '/masters/financial-year', permission: 'master.financial-year' },
    { name: 'Tax', path: '/masters/tax', permission: 'master.tax' },
    { name: 'Status', path: '/masters/status', permission: 'master.status' },
    { name: 'Parts', path: '/masters/parts', permission: 'master.parts' },
    { name: 'Customer', path: '/masters/customer', permission: 'master.customer' },
    { name: 'Service Type', path: '/masters/servicetype', permission: 'master.service-type' },
    { name: 'Currency', path: '/masters/currency', permission: 'master.currency' },
    { name: 'Department', path: '/masters/department', permission: 'master.department' },
    { name: 'Brand', path: '/masters/brand', permission: 'master.brand' },
    { name: 'Asset Master', path: '/masters/assetmaster', permission: 'master.asset-master' },
    { name: 'Issue Summary', path: '/masters/issuesummary', permission: 'master.issue-summary' },
    { name: 'Ticket Source', path: '/masters/ticketsource', permission: 'master.ticket-source' },
    { name: 'Vendor Master', path: '/masters/vendormaster', permission: 'master.vendor-master' },
  ];

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: dashbaordIcon, permission: 'dashboard' },
    {
      name: 'Masters',
      icon: masterIcon,
      permission: 'master',
      subItems: masterSubItems,
    },
    { name: 'Tickets', path: '/tickets', icon: ticketIcon, permission: 'ticket' },
    { name: 'Call Reports', path: '/callreports', icon: callReportIcon, permission: 'call-report' },
    {
      name: 'Unbilled Call Reports',
      path: '/unbilled-callreports',
      icon: callReportIcon,
      permission: 'unbilled-call-report',
    },
    {
      name: 'Bill & Receipts',
      icon: billsreceipts,
      permission: 'bills-and-receipts',
      subItems: [
        { name: 'Bills', path: '/bills', permission: 'bills-and-receipts.bills' },
        { name: 'Receipts', path: '/receipts', permission: 'bills-and-receipts.receipts' },
      ],
    },
    {
      name: 'Item Repair',
      icon: ItemRepairIcon,
      permission: 'item-repair',
      subItems: [
        { name: 'Assign Item for Repair', path: '/item-repair/assign', permission: 'item-repair.assign-item-for-repair' },
        { name: 'Assigned items', path: '/item-repair/assigned', permission: 'item-repair.assigned-items' },
      ],
    },
    {
      name: 'More',
      icon: moreIcon,
      permission: 'more',
      subItems: [
        { name: 'Customer Details', path: '/more/customer-details', permission: 'more.customer-details' },
        { name: 'Collection Summary', path: '/more/collectionsummary', permission: 'more.collection-summary' },
        { name: 'Punch In & Punch Out', path: '/more/punch-io', permission: 'more.punch-in-and-punch-out' },
        { name: 'Leave Application', path: '/more/leaveapplication', permission: 'more.leave-application' },
        { name: 'Leave Approval', path: '/more/leaveapproval', permission: 'more.leave-approval' },
        { name: 'Traveling Expense', path: '/more/traveling-expense', permission: 'more.traveling-expense' },
        { name: 'Travel Log', path: '/more/travel-log', permission: 'more.travel-log' },
        { name: 'Work Summary', path: '/more/work-summary', permission: 'more.work-summary' },
        { name: 'Task Calendar', path: '/more/task-calendar', permission: 'more.task-calendar' },
        { name: 'Agent Analysis', path: '/more/agent-analysis', permission: 'more.agent-analysis' },
        { name: 'Review Closed Tickets', path: '/more/review-closed-tickets', permission: 'more.review-closed-tickets' },
        { name: 'Expense Approval', path: '/more/expense-approval', permission: 'more.expense-approval' },
        { name: 'Agent Availability', path: '/more/agent-availability', permission: 'more.agent-availability' },
      ],
    },
    { name: 'Reports', path: '/reports', icon: reportsIcon, permission: 'reports' },
    { 
      name: 'Settings',
      icon: settingsIcon,
      permission: 'settings',
      subItems: [
        { name: 'Features', path: '/settings/features', permission: 'settings.features' },
        { name: 'Supervisor Agent Linking', path: '/settings/supervisoragentlinking', permission: 'settings.supervisor-agent-linking' },
        { name: 'Notification Settings', path: '/settings/notificationsettings', permission: 'settings.notification-settings' },
        { name: 'User Roles', path: '/settings/userroles', permission: 'settings.user-roles' },
        { name: 'Configurations', path: '/settings/configurations', permission: 'settings.configurations' },
        { name: 'Company Details', path: '/settings/companydetails', permission: 'settings.company-details' },
      ],
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <aside
      className={`fixed left-0 top-[38px] z-40 flex h-[calc(100vh-38px)] flex-col bg-linear-[180deg,#09486c_0%,#145c85_86.59%,#09486c_100%] font-sans font-normal text-white shadow-xl transition-all duration-300 ${
        isMobile
          ? `w-[min(82vw,280px)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : isSidebarOpen
            ? 'w-[240px] translate-x-0'
            : 'w-[72px] translate-x-0'
      }`}
      aria-hidden={isMobile && !isSidebarOpen}
    >
      <nav className="min-h-0 flex-1 overflow-y-auto px-[15px] pt-7 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="space-y-1.5" ref={containerRef}>
          {!permissionsLoading && menuItems.map((item) => {
            if (!canAccessModule(item.permission)) return null;
            const permittedSubItems = item.subItems?.filter((subItem) =>
              canAccessModule(subItem.permission),
            );
            if (item.subItems && !permittedSubItems?.length) return null;
            const hasSub = Boolean(permittedSubItems?.length);
            const isOpen = isSidebarOpen && openMenu === item.name;

            if (hasSub) {
              return (
                <li key={item.name} className="relative">
                  <button
                    onClick={() => setOpenMenu(isOpen ? null : item.name)}
                    className={`flex h-[37px] w-full items-center rounded-md border px-3 cursor-pointer transition-colors ${
                      isOpen
                        ? 'border-[#66b6d5] bg-[#166c8c]'
                        : 'border-transparent hover:border-[#237797] hover:bg-[#146784]'
                    }`}
                    title={item.name}
                    type="button"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="h-5 w-5 opacity-95"
                      />
                    </span>
                    {isSidebarOpen && (
                      <div className="ml-4 flex min-w-0 flex-1 items-center justify-between">
                        <span className="truncate text-[15px] font-normal">{item.name}</span>
                        <svg
                          className={`h-3.5 w-3.5 text-white transition-transform duration-200 ${
                            isOpen ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="9 6 15 12 9 18"></polyline>
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Dropdown in Small White Box - Floating directly below (Sidebar Open) or Floating to side (Sidebar Closed) */}
                  {isOpen && (
                    <div
                      className={`absolute z-[9999] bg-white border border-slate-100 rounded-xs shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 flex flex-col animate-in fade-in duration-150
                        ${
                          isSidebarOpen
                            ? 'left-0 top-[41px] w-[196px]'
                            : 'left-[57px] top-0 w-48'
                        }`}
                    >
                      <div
                        className={`flex flex-col w-full
                          ${
                            permittedSubItems!.length > 8
                              ? 'max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-50/25'
                              : ''
                          }`}
                      >
                        {permittedSubItems!.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            onClick={() => {
                              setOpenMenu(null);
                              onNavigate?.();
                            }}
                            className={({ isActive }) =>
                              `px-4 py-2 text-[13px] font-normal text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center ${
                                isActive
                                  ? 'bg-sky-50 text-[#1e5b86] font-normal'
                                  : ''
                              }`
                            }
                          >
                            {sub.name}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            }

            // Normal list item
            return (
              <li key={item.name}>
                <NavLink
                  to={item.path!}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex h-[39px] w-15px items-center rounded-md border px-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'border-[#91cce2] bg-[#3895b9]'
                        : 'border-transparent hover:border-[#237797] hover:bg-[#146784]'
                    }`
                  }
                  title={item.name}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="h-5 w-5 opacity-95"
                    />
                  </span>
                  {isSidebarOpen && (
                    <span className="ml-4 truncate text-[15px] font-normal">{item.name}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <Banner isSidebarOpen={isSidebarOpen} />
    </aside>
  );
};

export default Sidebar;
