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
import DashboardCallReport from "../Pages/CallReport/CallReport";

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
import CustomerTickets from "../Pages/Ticket/CustomerTickets/CustomerTickets";
import AssignAgentTickets from "../Pages/Ticket/AssignAgentTickets/AssignAgentTickets";
import TicketHistory from "../Pages/Ticket/TicketHistory/TicketHistory";
import TicketFollowUp from "../Pages/Ticket/TicketFollowUp/TicketFollowUp";
import BillPreviewPage from "../Pages/Bills/BillPreviewPage";
import TicketView from "../Pages/Ticket/TicketView/TicketView";
import TicketEstimatePage from "../Pages/Ticket/Common/TicketEstimatePage";
import EstimatePdfViewer from "../Pages/Ticket/Common/EstimatePdfViewer";
import MergeTicketsPage from "../Pages/Ticket/Common/MergeTicketsPage";
import ShareCallReportView from "../Pages/Ticket/Common/ShareCallReportView";

const Routes: React.FC = () => {
  return (
    <BrowserRouter>
      <ReactRoutes>
        {/* Public Routes */}

        <Route path="/login" element={<Login />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/forgot-password-otp" element={<EnterOtp />} />

        <Route path="/set-new-password" element={<SetNewPassword />} />

        {/* Private Routes */}

        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            {/* Dashboard */}

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/call-reports" element={<DashboardCallReport />} />
            <Route path="/callreports/view" element={<DashboardCallReport />} />

            {/* Master Module */}

            <Route path="/masters/agent" element={<AgentMasterList />} />

            <Route path="/masters/agent-group" element={<AgentGroupList />} />

            <Route path="/masters/trip-mode" element={<TripModeList />} />

            <Route path="/masters/tripmode" element={<TripModeList />} />

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

            <Route path="/masters/tax" element={<TaxList />} />

            <Route path="/masters/status" element={<StatusList />} />

            <Route path="/masters/parts" element={<PartsList />} />

            <Route path="/masters/customer" element={<CustomerList />} />

            <Route path="/masters/servicetype" element={<ServiceTypeList />} />

            <Route path="/masters/service-type" element={<ServiceTypeList />} />

            <Route path="/masters/currency" element={<CurrencyMasterList />} />

            <Route path="/masters/department" element={<DepartmentList />} />

            <Route path="/masters/brand" element={<BrandList />} />

            <Route
              path="/masters/ticketsource"
              element={<TicketSourceList />}
            />

            <Route path="/masters/vendor" element={<VendorList />} />

            <Route path="/masters/vendormaster" element={<VendorList />} />

            <Route path="/masters/assetmaster" element={<AssetMasterList />} />

            <Route path="/masters/asset-master" element={<AssetMasterList />} />

            <Route path="/masters/issuesummary" element={<IssueSummary />} />

            <Route path="/masters/issue-summary" element={<IssueSummary />} />

            {/* ========================= */}
            {/* Ticket Module */}
            {/* ========================= */}

            <Route path="/tickets" element={<TicketList />} />

            <Route path="/tickets/create" element={<TicketCreate />} />

            <Route
              path="/tickets/customertickets"
              element={<CustomerTickets />}
            />

            <Route
              path="/tickets/previoustickets"
              element={<CustomerTickets />}
            />

            <Route
              path="/tickets/agenttickets"
              element={<AssignAgentTickets />}
            />

            <Route path="/tickets/edit/:id" element={<TicketCreate />} />

            <Route path="/tickets/view" element={<TicketView />} />

            <Route path="/tickets/view/:id" element={<TicketView />} />

            <Route path="/tickets/merge" element={<MergeTicketsPage />} />

            <Route path="/tickets/estimate" element={<TicketEstimatePage />} />

            <Route path="/tickets/history/:id" element={<TicketHistory />} />

            <Route path="/tickets/followup/:id" element={<TicketFollowUp />} />

            <Route
              path="/tickets/sharecallreport"
              element={<ShareCallReportView />}
            />

            <Route
              path="/callreport/callreportview"
              element={<ShareCallReportView />}
            />

            <Route
              path="/billsandreceipts/bills/add"
              element={<BillPreviewPage />}
            />
            <Route path="/bills/add" element={<BillPreviewPage />} />
          </Route>

          <Route path="/estimate-invoice" element={<EstimatePdfViewer />} />
        </Route>

        {/* Default Route */}

        <Route path="*" element={<Navigate to="/login" replace />} />
      </ReactRoutes>
    </BrowserRouter>
  );
};

export default Routes;
