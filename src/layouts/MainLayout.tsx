import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../common/sidebar/Sidebar';
import Header from '../common/Header/Header';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 font-sans">
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="relative z-0 flex min-h-0 flex-1 pt-[38px]">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main
          className="relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-4 pb-4 pt-0 transition-all duration-300"
          style={{ marginLeft: isSidebarOpen ? '16rem' : '5rem' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
