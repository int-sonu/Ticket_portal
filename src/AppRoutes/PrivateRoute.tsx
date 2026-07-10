import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { hasAuthenticatedSession } from '../Utils/session';

const PrivateRoute: React.FC = () => {
  return hasAuthenticatedSession() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
