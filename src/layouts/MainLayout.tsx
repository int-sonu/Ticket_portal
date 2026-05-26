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
      <div className="flex min-h-0 flex-1 pt-16">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <main
          className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 transition-all duration-300"
          style={{ marginLeft: isSidebarOpen ? '16rem' : '5rem' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
