import React from "react";
import {
  BrowserRouter,
  Routes as ReactRoutes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../Components/Login/Login";
import ForgotPassword from "../Components/Login/ForgotPassword/ForgotPassword";
import EnterOtp from "../Components/Login/EnterOtp/EnterOtp";
import SetNewPassword from "../Components/Login/SetNewPassword/SetNewPassword";

import PrivateRoute from "./PrivateRoute";
import MainLayout from "../layouts/MainLayout";

import Dashboard from "../Pages/Dashboard/Dashboard";

// Master Modules
import AgentGroupList from "../Pages/Master/AgentGroup/AgentGroupList";
import AgentMasterList from "../Pages/Master/Agent/AgentMasterList";
import TripModeList from "../Pages/Master/TripMode/TripModeList";
import FollowupModeList from "../Pages/Master/FollowUpMode/FollowUpModalList";
import FinancialYearList from "../Pages/Master/FinancialYear/FinancialYearList";
import TaxList from "../Pages/Master/Tax/TaxList";
import StatusList from "../Pages/Master/StatusMaster/StatusList";
import PartsList from "../Pages/Master/Parts/PartsList";
import CustomerList from "../Pages/Master/CustomerMaster/CustomerList";
import ServiceTypeList from "../Pages/Master/ServiceType/ServiceTypeList";
import CurrencyMasterList from "../Pages/Master/CurrencyMaster/CurrencyMasterList";
import DepartmentList from "../Pages/Master/Department/DepartmentMasterList";
import BrandList from "../Pages/Master/Brand/BrandMasterList";
import TicketSourceList from "../Pages/Master/TicketSource/TicketSourceList";
import VendorList from "../Pages/Master/VendorMaster/VendorMasterList";
import AssetMasterList from "../Pages/Master/AssetMaster/AssetMasterList";
import IssueSummary from "../Pages/Master/IssueSummary/IssueSummary";

// Ticket Module
import TicketList from "../Pages/Ticket/TicketList/TicketList";
import TicketCreate from "../Pages/Ticket/TicketCreate/TicketCreate";
import TicketHistory from "../Pages/Ticket/TicketHistory/TicketHistory";
import TicketFollowUp from "../Pages/Ticket/TicketFollowUp/TicketFollowUp";

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ReactRoutes>
        {/* Public Routes */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/forgot-password-otp"
          element={<EnterOtp />}
        />

        <Route
          path="/set-new-password"
          element={<SetNewPassword />}
        />

        {/* Private Routes */}

        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            {/* Master Module */}

            <Route
              path="/masters/agent"
              element={<AgentMasterList />}
            />

            <Route
              path="/masters/agent-group"
              element={<AgentGroupList />}
            />

            <Route
              path="/masters/trip-mode"
              element={<TripModeList />}
            />

            <Route
              path="/masters/tripmode"
              element={<TripModeList />}
            />

            <Route
              path="/masters/follow-up-mode"
              element={<FollowupModeList />}
            />

            <Route
              path="/masters/followup-mode"
              element={<FollowupModeList />}
            />

            <Route
              path="/masters/financial-year"
              element={<FinancialYearList />}
            />

            <Route
              path="/masters/tax"
              element={<TaxList />}
            />

            <Route
              path="/masters/status"
              element={<StatusList />}
            />

            <Route
              path="/masters/parts"
              element={<PartsList />}
            />

            <Route
              path="/masters/customer"
              element={<CustomerList />}
            />

            <Route
              path="/masters/servicetype"
              element={<ServiceTypeList />}
            />

            <Route
              path="/masters/service-type"
              element={<ServiceTypeList />}
            />

            <Route
              path="/masters/currency"
              element={<CurrencyMasterList />}
            />

            <Route
              path="/masters/department"
              element={<DepartmentList />}
            />

            <Route
              path="/masters/brand"
              element={<BrandList />}
            />

            <Route
              path="/masters/ticketsource"
              element={<TicketSourceList />}
            />

            <Route
              path="/masters/vendor"
              element={<VendorList />}
            />

            <Route
              path="/masters/vendormaster"
              element={<VendorList />}
            />

            <Route
              path="/masters/assetmaster"
              element={<AssetMasterList />}
            />

            <Route
              path="/masters/asset-master"
              element={<AssetMasterList />}
            />

            <Route
              path="/masters/issuesummary"
              element={<IssueSummary />}
            />

            <Route
              path="/masters/issue-summary"
              element={<IssueSummary />}
            />

            {/* ========================= */}
            {/* Ticket Module */}
            {/* ========================= */}

            <Route
              path="/tickets"
              element={<TicketList />}
            />

            <Route
              path="/tickets/create"
              element={<TicketCreate />}
            />

            <Route
              path="/tickets/edit/:id"
              element={<TicketCreate />}
            />

            <Route
              path="/tickets/history/:id"
              element={<TicketHistory />}
            />

            <Route
              path="/tickets/followup/:id"
              element={<TicketFollowUp />}
            />
          </Route>
        </Route>

        {/* Default Route */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </ReactRoutes>
    </BrowserRouter>
  );
};

export default Routes;