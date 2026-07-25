import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../common/sidebar/Sidebar';
import Header from '../common/Header/Header';

const MainLayout: React.FC = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const location = useLocation();
  const isTicketRoute = location.pathname.startsWith('/tickets');

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
          style={{ marginLeft: isMobile ? 0 : isSidebarOpen ? '226px' : '72px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
