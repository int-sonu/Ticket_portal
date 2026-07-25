import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import Banner from './Banner';

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
}

interface MenuItem {
  name: string;
  path?: string;
  icon: string;
  subItems?: SubMenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  isMobile = false,
  onNavigate,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLUListElement>(null);

  const masterSubItems = [
      { name: 'Agent Group', path: '/masters/agent-group' },
    { name: 'Agent', path: '/masters/agent' },
    
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
    { name: 'Dashboard', path: '/dashboard', icon: dashbaordIcon },
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
      icon: callReportIcon,
    },
    {
      name: 'Bill & Receipts',
      icon: billsreceipts,
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

  return (
    <aside
      className={`fixed top-[38px] left-0 z-40 flex h-[calc(100vh-38px)] flex-col bg-[#075a7a] text-white shadow-xl transition-all duration-300 ${
        isMobile
          ? `w-[min(82vw,280px)] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : isSidebarOpen
            ? 'w-[226px] translate-x-0'
            : 'w-[72px] translate-x-0'
      }`}
      aria-hidden={isMobile && !isSidebarOpen}
    >
      <nav className="min-h-0 flex-1 overflow-y-auto px-[15px] pt-7 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <ul className="space-y-1.5" ref={containerRef}>
          {menuItems.map((item) => {
            const hasSub = !!item.subItems;
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
                        <span className="truncate text-[14px] font-semibold">{item.name}</span>
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
                      className={`absolute z-[9999] bg-white border border-slate-100 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 flex flex-col animate-in fade-in duration-150
                        ${
                          isSidebarOpen
                            ? 'left-0 top-[41px] w-[196px]'
                            : 'left-[57px] top-0 w-48'
                        }`}
                    >
                      <div
                        className={`flex flex-col w-full
                          ${
                            item.subItems!.length > 8
                              ? 'max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-50/25'
                              : ''
                          }`}
                      >
                        {item.subItems!.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            onClick={() => {
                              setOpenMenu(null);
                              onNavigate?.();
                            }}
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
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex h-[37px] items-center rounded-md border px-3 cursor-pointer transition-colors ${
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
                    <span className="ml-4 truncate text-[14px] font-semibold">{item.name}</span>
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
