import React from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route, Navigate } from 'react-router-dom';
import Login from '../Components/Login/Login';
import ForgotPassword from '../Components/Login/ForgotPassword/ForgotPassword';
import EnterOtp from '../Components/Login/EnterOtp/EnterOtp';
import SetNewPassword from '../Components/Login/SetNewPassword/SetNewPassword';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../layouts/MainLayout';

// Dashboard page placeholder — replace with real component when ready
const Dashboard = () => <></>;


const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ReactRoutes>
       
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/forgot-password-otp" element={<EnterOtp />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />
        
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
