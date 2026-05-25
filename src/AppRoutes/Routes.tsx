import React from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route, Navigate } from 'react-router-dom';
import Login from '../Components/Login/Login';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../layouts/MainLayout';

// A simple dummy dashboard page for now
const Dashboard = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Welcome to the Dashboard!</h1>
    <p className="mt-2 text-gray-600">You are successfully logged in and viewing a protected route.</p>
  </div>
);

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ReactRoutes>
       
        <Route path="/login" element={<Login />} />
        
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </ReactRoutes>
    </BrowserRouter>
  );
};

export default Routes;
