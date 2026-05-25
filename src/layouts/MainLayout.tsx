import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import { useLogout } from '../Hooks/useAuth';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: logoutUser } = useLogout();

  const handleLogout = () => {
    logoutUser(undefined, {
      onSettled: () => {
        sessionStorage.removeItem('userSession');
        navigate('/login');
      }
    });
  };

  return (
    <Layout className="min-h-screen">
      <Header className="flex items-center justify-between bg-white px-6 shadow-sm z-10">
        <div className="text-xl font-bold text-[#0d3a8d]">Ticket Portal</div>
        <Button onClick={handleLogout} type="default">Logout</Button>
      </Header>
      <Layout>
        <Sider width={200} className="bg-white border-r border-gray-200 hidden md:block">
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            className="h-full border-r-0"
            items={[
              { key: '1', label: 'Dashboard' },
              { key: '2', label: 'Tickets' },
              { key: '3', label: 'Reports' },
            ]}
          />
        </Sider>
        <Layout className="p-6">
          <Content className="bg-white p-6 m-0 min-h-[280px] rounded-md shadow-sm">
            {/* The Outlet renders the component for the current matching route */}
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
