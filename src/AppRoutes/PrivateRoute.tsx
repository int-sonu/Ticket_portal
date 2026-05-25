import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute: React.FC = () => {
  const sessionData = sessionStorage.getItem('userSession');
  
  // If we have session data, render the child routes via Outlet
  // Otherwise, redirect them to the login page
  return sessionData ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
