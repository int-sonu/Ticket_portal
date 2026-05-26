import React from 'react';
import { BrowserRouter, Routes as ReactRoutes, Route, Navigate } from 'react-router-dom';
import Login from '../Components/Login/Login';
import ForgotPassword from '../Components/Login/ForgotPassword/ForgotPassword';
import EnterOtp from '../Components/Login/EnterOtp/EnterOtp';
import SetNewPassword from '../Components/Login/SetNewPassword/SetNewPassword';
import PrivateRoute from './PrivateRoute';
import MainLayout from '../layouts/MainLayout';

import Dashboard from '../Pages/Dashboard/Dashboard';
import AgentGroupList from '../Pages/Master/AgentGroup/AgentGroupList';
import AgentMasterList from '../Pages/Master/AgentGroup/AgentMasterList';
import TripModeList from '../Pages/Master/TripMode/TripModeList';
import FollowupModeList from '../Pages/Master/FollowUpMode/FollowUpModalList';
import FinancialYearList from "../Pages/Master/FinancialYear/FinancialYearList";
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
            <Route path="/masters/agent" element={<AgentMasterList />} />
            <Route path="/masters/agent-group" element={<AgentGroupList />} />
            <Route path="/masters/trip-mode" element={<TripModeList />} />
            <Route path="/masters/tripmode" element={<TripModeList />} />
            <Route path="/masters/follow-up-mode" element={<FollowupModeList />} />
            <Route path="/masters/followup-mode" element={<FollowupModeList />} />
            <Route
  path="/masters/financial-year"
  element={<FinancialYearList />}
/>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </ReactRoutes>
    </BrowserRouter>
  );
};

export default Routes;
