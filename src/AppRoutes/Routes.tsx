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
import UnbilledCallReportPage from "../Pages/CallReport/UnbilledCallReportPage";
import BillingCustomerCallReportPage from "../Pages/CallReport/BillingCustomerCallReportPage";
import CallReportViewPage from "../Pages/CallReport/CallReportViewPage";
import TicketView from "../Pages/Ticket/TicketView/TicketView";

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
import BillViewPage from "../Pages/Bills/BillViewPage";
import BillsListPage from "../Pages/Bills/BillsListPage";
import ReceiptsListPage from "../Pages/Bills/ReceiptsListPage";
import ReceiptCreatePage from "../Pages/Bills/ReceiptCreatePage";
import AssignedItemRepairPage from "../Pages/ItemRepair/AssignedItemRepairPage";
import PendingItemRepairPage from "../Pages/ItemRepair/PendingItemRepairPage";
import TicketEstimatePage from "../Pages/Ticket/Common/TicketEstimatePage";
import EstimatePdfViewer from "../Pages/Ticket/Common/EstimatePdfViewer";
import MergeTicketsPage from "../Pages/Ticket/Common/MergeTicketsPage";
import ShareCallReportView from "../Pages/Ticket/Common/ShareCallReportView";
import CustomerProfileDetailsPage from "../Pages/CustomerProfileDetailsPage";
import CollectionSummaryListPage from "../Pages/More/CollectionSummary/CollectionSummaryListPage";
import LeaveApplicationPage from "../Pages/More/LeaveApplication/LeaveApplicationPage";
import LeaveApprovalPage from "../Pages/More/LeaveApproval/LeaveApprovalPage";
import LeaveApprovalViewPage from "../Pages/More/LeaveApproval/LeaveApprovalViewPage";
import TravelingExpensePage from "../Pages/More/TravelingExpenseModalPage";
import TravelingExpenseViewPage from "../Pages/More/TravelingExpenseViewPage";
import TravelLogPage from "../Pages/More/TravelLogPage";
import ReviewClosedTicketsPage from "../Pages/More/ReviewClosedTicketsPage";
import TaskCalendarPage from "../Pages/More/TaskCalendarPage";
import AgentAnalysisPage from "../Pages/More/AgentAnalysisPage";
import ExpenseApprovalPage from "../Pages/More/ExpenseApprovalPage";
import ExpenseApprovalViewPage from "../Pages/More/ExpenseApprovalViewPage";

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
            <Route path="/callreports" element={<DashboardCallReport />} />
            <Route
              path="/billed-callreports"
              element={<DashboardCallReport initialTab="BILLED" />}
            />
            <Route
              path="/unbilled-callreports"
              element={<UnbilledCallReportPage />}
            />
            
            <Route path="/callreports/view" element={<CallReportViewPage />} />

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

            <Route path="/more/customer-details" element={<CustomerProfileDetailsPage />} />
            <Route path="/more/collectionsummary" element={<CollectionSummaryListPage />} />
            <Route path="/more/collection-summary" element={<CollectionSummaryListPage />} />
            <Route path="/more/traveling-expense" element={<TravelingExpensePage />} />
            <Route path="/more/travelingexpense" element={<TravelingExpensePage />} />
            <Route path="/more/travelingexpense/view" element={<TravelingExpenseViewPage />} />
            <Route path="/more/traveling-expense/view" element={<TravelingExpenseViewPage />} />
            <Route path="/more/travel-log" element={<TravelLogPage />} />
            <Route path="/more/task-calendar" element={<TaskCalendarPage />} />
            <Route path="/more/agent-analysis" element={<AgentAnalysisPage />} />
            <Route path="/more/taskcalendar/view" element={<AssignAgentTickets />} />
            <Route path="/more/leave-application" element={<LeaveApplicationPage />} />
            <Route path="/more/leaveapplication" element={<LeaveApplicationPage />} />
            <Route path="/more/leaveapproval" element={<LeaveApprovalPage />} />
            <Route path="/more/leave-approval" element={<LeaveApprovalPage />} />
            <Route path="/more/leaveapproval/view" element={<LeaveApprovalViewPage />} />
            <Route path="/more/expense-approval" element={<ExpenseApprovalPage />} />
            <Route path="/more/expenseapproval" element={<ExpenseApprovalPage />} />
            <Route path="/more/expense-approval/view" element={<ExpenseApprovalViewPage />} />
            <Route path="/more/expenseapproval/view" element={<ExpenseApprovalViewPage />} />
            <Route
              path="/more/review-closed-tickets"
              element={<ReviewClosedTicketsPage />}
            />

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

            <Route path="/tickets/agenttickets" element={<AssignAgentTickets />} />

            <Route path="/tickets/edit/:id" element={<TicketCreate />} />

            <Route path="/tickets/view" element={<TicketView />} />

            <Route path="/tickets/view/:id" element={<TicketView />} />
            <Route
              path="/itemrepair/assignitemforrepair/itemforrepairview"
              element={<TicketView />}
            />
            <Route
              path="/itemrepair/assignitemforrepair/itemforrepairview/:id"
              element={<TicketView />}
            />

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
            <Route
              path="/billsandreceipts/bill/view"
              element={<BillViewPage />}
            />
            <Route
              path="/billsandreceipts/bills/customercallreport"
              element={<BillingCustomerCallReportPage />}
            />
            <Route
              path="/billsandreceipts/bills/edit"
              element={<BillPreviewPage />}
            />
            <Route path="/billsandreceipts/bills" element={<BillsListPage />} />
            <Route path="/bills" element={<BillsListPage />} />
            <Route path="/receipts" element={<ReceiptsListPage />} />
            <Route path="/receipts/add" element={<ReceiptCreatePage />} />
            <Route path="/bills/add" element={<BillPreviewPage />} />
            <Route path="/bills/edit" element={<BillPreviewPage />} />
            <Route path="/item-repair/assign" element={<AssignedItemRepairPage />} />
            <Route path="/item-repair/assigned" element={<AssignedItemRepairPage />} />
            <Route path="/item-repair/pending" element={<PendingItemRepairPage />} />
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
