import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import Banner from './Banner';

// Import SVG icons
import dashbaordIcon from '../../assets/icons/dashbaordIcon.svg';
import masterIcon from '../../assets/icons/masterIcon.svg';
import ticketIcon from '../../assets/icons/ticketIcon.svg';
import callReportIcon from '../../assets/icons/callReportIcon.svg';
import billReportIcon from '../../assets/icons/billReportIcon.svg';
import receiptIcon from '../../assets/icons/cash-icon-white.svg';
import ItemRepairIcon from '../../assets/icons/ItemRepairIcon.svg';
import moreIcon from '../../assets/icons/moreIcon.svg';
import reportsIcon from '../../assets/icons/reports-icon.svg';
import settingsIcon from '../../assets/icons/settingsIcon.svg';
interface SidebarProps {
  isSidebarOpen: boolean;
}

interface SubMenuItem {
  name: string;
  path: string;
}

interface MenuItem {
  name: string;
  path?: string;
  icon: string;
  subItems?: SubMenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);

  const masterSubItems = [
    { name: 'Agent', path: '/masters/agent' },
      { name: 'Agent Group', path: '/masters/agent-group' },
    { name: 'Trip Mode', path: '/masters/trip-mode' },
    { name: 'Follow Up Mode', path: '/masters/follow-up-mode' },
    { name: 'Financial Year', path: '/masters/financial-year' },
    { name: 'Tax', path: '/masters/tax' },
    { name: 'Status', path: '/masters/status' },
    { name: 'Parts', path: '/masters/parts' },
    { name: 'Customer', path: '/masters/customer' },
    { name: 'Service Type', path: '/masters/servicetype' },
    { name: 'Currency', path: '/masters/currency' },
    { name: 'Department', path: '/masters/department' },
    { name: 'Brand', path: '/masters/brand' },
    { name: 'Asset Master', path: '/masters/assetmaster' },
    { name: 'Issue Summary', path: '/masters/issuesummary' },
    { name: 'Ticket Source', path: '/masters/ticketsource' },
    { name: 'Vendor Master', path: '/masters/vendormaster' },
  ];

  const menuItems: MenuItem[] = [
    {
      name: 'Masters',
      icon: masterIcon,
      subItems: masterSubItems,
    },
    { name: 'Tickets', path: '/tickets', icon: ticketIcon },
    { name: 'Call Reports', path: '/callreports', icon: callReportIcon },
    {
      name: 'Unbilled Call Reports',
      path: '/unbilled-callreports',
      icon: billReportIcon,
    },
    {
      name: 'Bill & Receipts',
      icon: receiptIcon,
      subItems: [
        { name: 'Bills', path: '/bills' },
        { name: 'Receipts', path: '/receipts' },
      ],
    },
    {
      name: 'Item Repair',
      icon: ItemRepairIcon,
      subItems: [
        { name: 'Assign Item for Repair', path: '/item-repair/assign' },
        { name: 'Assigned items', path: '/item-repair/assigned' },
      ],
    },
    {
      name: 'More',
      icon: moreIcon,
      subItems: [
        { name: 'Customer Details', path: '/more/customer-details' },
        { name: 'Collection Summary', path: '/more/collectionsummary' },
        { name: 'Punch In & Punch Out', path: '/more/punch-io' },
        { name: 'Leave Application', path: '/more/leaveapplication' },
        { name: 'Leave Approval', path: '/more/leaveapproval' },
        { name: 'Traveling Expense', path: '/more/traveling-expense' },
        { name: 'Travel Log', path: '/more/travel-log' },
        { name: 'Work Summary', path: '/more/work-summary' },
        { name: 'Task Calendar', path: '/more/task-calendar' },
        { name: 'Agent Analysis', path: '/more/agent-analysis' },
        { name: 'Review Closed Tickets', path: '/more/review-closed-tickets' },
        { name: 'Expense Approval', path: '/more/expense-approval' },
        { name: 'Agent Availability', path: '/more/agent-availability' },
      ],
    },
    { name: 'Reports', path: '/reports', icon: reportsIcon },
    { 
      
      name: 'Settings',
      icon: settingsIcon,
      subItems: [
        { name: 'Features', path: '/settings/features' },
        { name: 'Supervisor Agent Linking', path: '/settings/supervisoragentlinking' },
        { name: 'Notification Settings', path: '/settings/notificationsettings' },
        { name: 'User Roles', path: '/settings/userroles' },
        { name: 'Configurations', path: '/settings/configurations' },
        { name: 'Company Details', path: '/settings/companydetails' },
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

  // Automatically close submenus if sidebar closes
  useEffect(() => {
    setOpenMenu(null);
  }, [isSidebarOpen]);

  return (
    <aside
      className={`fixed top-[38px] left-0 z-40 flex h-[calc(100vh-38px)] flex-col bg-[#1f5f8a] text-white shadow-xl transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      <nav className="flex-1 overflow-y-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="space-y-0.5" ref={containerRef}>
          {/* Dashboard (Top Item - rendered manually to keep it highlight-friendly) */}
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#184f74] ${
                  isActive
                    ? 'border-l-4 border-cyan-400 bg-[#184f74]'
                    : 'border-l-4 border-transparent'
                }`
              }
              title="Dashboard"
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                <img
                  src={dashbaordIcon}
                  alt="Dashboard"
                  className="h-5 w-5 opacity-95"
                />
              </span>
              {isSidebarOpen && (
                <span className="ml-4 truncate text-[13px] font-medium">Dashboard</span>
              )}
            </NavLink>
          </li>

          {/* Generically rendered items */}
          {menuItems.map((item) => {
            const hasSub = !!item.subItems;
            const isOpen = openMenu === item.name;

            if (hasSub) {
              return (
                <li key={item.name} className="relative">
                  <button
                    onClick={() => setOpenMenu(isOpen ? null : item.name)}
                    className={`flex w-full items-center px-4 py-2.5 cursor-pointer border-l-4 transition-colors hover:bg-[#184f74] ${
                      isOpen
                        ? 'border-cyan-400 bg-[#184f74]'
                        : 'border-l-4 border-transparent'
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
                        <span className="truncate text-[13px] font-medium">{item.name}</span>
                        <svg
                          className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Dropdown in Small White Box - Floating directly below (Sidebar Open) or Floating to side (Sidebar Closed) */}
                  {isOpen && (
                    <div
                      className={`absolute z-[9999] bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 flex flex-col animate-in fade-in duration-150
                        ${
                          isSidebarOpen
                            ? 'left-4 top-[44px] w-[210px]'
                            : 'left-20 top-0 w-48'
                        }`}
                    >
                      <div
                        className={`flex flex-col w-full
                          ${
                            item.subItems!.length > 8
                              ? 'max-h-[280px] overflow-y-auto scrollbar-thin'
                              : ''
                          }`}
                      >
                        {item.subItems!.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            onClick={() => setOpenMenu(null)}
                            className={({ isActive }) =>
                              `px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors flex items-center ${
                                isActive
                                  ? 'bg-sky-50 text-[#1e5b86] font-bold'
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
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2.5 cursor-pointer border-l-4 transition-colors hover:bg-[#184f74] ${
                      isActive
                        ? 'border-cyan-400 bg-[#184f74]'
                        : 'border-l-4 border-transparent'
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
                    <span className="ml-4 truncate text-[13px] font-medium">{item.name}</span>
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
