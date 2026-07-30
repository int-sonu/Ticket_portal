import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../common/sidebar/Sidebar';
import Header from '../common/Header/Header';
import {
  PermissionProvider,
  usePermissions,
} from '../common/sidebar/PermissionContext';

const masterRouteAliases: Record<string, string> = {
  tripmode: 'trip-mode',
  'followup-mode': 'follow-up-mode',
  servicetype: 'service-type',
  ticketsource: 'ticket-source',
  vendor: 'vendor-master',
  vendormaster: 'vendor-master',
  assetmaster: 'asset-master',
  issuesummary: 'issue-summary',
};

type RoutePermission = {
  key: string;
  moduleOnly?: boolean;
};

const routePermission = (pathname: string): RoutePermission | null => {
  const path = pathname.toLowerCase();
  if (path.startsWith('/dashboard')) return { key: 'dashboard', moduleOnly: true };
  if (path.startsWith('/masters/')) {
    const routeName = path.split('/')[2];
    const moduleName = masterRouteAliases[routeName] ?? routeName;
    return { key: `master.${moduleName}.view` };
  }
  if (path === '/tickets/create') return { key: 'ticket.create' };
  if (path.startsWith('/tickets/edit')) return { key: 'ticket.edit' };
  if (path.startsWith('/tickets/merge')) return { key: 'ticket.merge' };
  if (path.startsWith('/tickets/estimate')) return { key: 'ticket.estimate' };
  if (path.startsWith('/tickets/agenttickets')) return { key: 'ticket.assign' };
  if (path.startsWith('/tickets/sharecallreport')) return { key: 'ticket.share' };
  if (path.startsWith('/tickets/view')) return { key: 'ticket.view' };
  if (path.startsWith('/tickets')) return { key: 'ticket.view' };
  if (path.startsWith('/unbilled-callreports')) return { key: 'unbilled-call-report.view' };
  if (path.startsWith('/callreports') || path.startsWith('/billed-callreports')) {
    return { key: 'call-report.view' };
  }
  if (path.startsWith('/billsandreceipts/bills') || path.startsWith('/bills')) {
    const action = path.includes('/add')
      ? 'add-new'
      : path.includes('/edit')
        ? 'edit'
        : 'view';
    return { key: `bills-and-receipts.bills.${action}` };
  }
  if (path.startsWith('/receipts')) {
    const action = path.includes('/add') ? 'add-new' : 'view';
    return { key: `bills-and-receipts.receipts.${action}` };
  }
  if (path.startsWith('/item-repair') || path.startsWith('/itemrepair')) {
    const moduleName = path.includes('assigned')
      ? 'assigned-items'
      : 'assign-item-for-repair';
    return { key: `item-repair.${moduleName}`, moduleOnly: true };
  }
  if (path.startsWith('/more/')) {
    const routeName = path.split('/')[2]
      .replace('collectionsummary', 'collection-summary')
      .replace('travelingexpense', 'traveling-expense')
      .replace('leaveapplication', 'leave-application')
      .replace('leaveapproval', 'leave-approval')
      .replace('expenseapproval', 'expense-approval')
      .replace('worksummary', 'work-summary')
      .replace('punchinout', 'punch-in-and-punch-out')
      .replace('punch-io', 'punch-in-and-punch-out');
    const moduleKey = `more.${routeName}`;
    const modulesWithView = new Set([
      'customer-details',
      'collection-summary',
      'leave-application',
      'leave-approval',
      'traveling-expense',
    ]);
    return modulesWithView.has(routeName)
      ? { key: `${moduleKey}.view` }
      : { key: moduleKey, moduleOnly: true };
  }
  if (path === '/reports') return { key: 'reports', moduleOnly: true };
  if (path.startsWith('/settings/')) {
    const routeName = path
      .split('/')[2]
      .replace('userroles', 'user-roles')
      .replace('notificationsettings', 'notification-settings')
      .replace('supervisoragentlinking', 'supervisor-agent-linking')
      .replace('companydetails', 'company-details');
    return { key: `settings.${routeName}`, moduleOnly: true };
  }
  return null;
};

const AccessDenied = () => (
  <div className="flex h-full min-h-[360px] items-center justify-center bg-white">
    <div className="max-w-md px-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
        !
      </div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Access Denied</h1>
      <p className="mt-2 text-sm text-slate-500">
        You do not have permission to access this module or perform this action.
      </p>
    </div>
  </div>
);

const MainLayoutContent: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const location = useLocation();
  const { loading: permissionsLoading, can, canAccessModule } = usePermissions();
  const isTicketRoute = location.pathname.startsWith('/tickets');
  const permission = routePermission(location.pathname);
  const hasRouteAccess =
    !permission ||
    (permission.moduleOnly
      ? canAccessModule(permission.key)
      : can(permission.key));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleViewportChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
      setIsSidebarOpen(!event.matches);
    };

    mediaQuery.addEventListener('change', handleViewportChange);

    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 font-sans">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="relative z-0 flex min-h-0 flex-1 pt-[38px]">
        {isMobile && isSidebarOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-x-0 bottom-0 top-[38px] z-30 bg-slate-950/40 backdrop-blur-[1px]"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          onNavigate={() => isMobile && setIsSidebarOpen(false)}
        />
        <main
          className={`relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden px-2 pb-2 pt-0 transition-all duration-300 sm:px-4 sm:pb-4 ${
            isTicketRoute ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
          style={{ marginLeft: isMobile ? 0 : isSidebarOpen ? '240px' : '72px' }}
        >
          {permissionsLoading ? null : hasRouteAccess ? <Outlet /> : <AccessDenied />}
        </main>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => (
  <PermissionProvider>
    <MainLayoutContent />
  </PermissionProvider>
);

export default MainLayout;
