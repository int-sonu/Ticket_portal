import customerIcon from "../../assets/Reports/CustomerDetails.svg";
import ticketIcon from "../../assets/Reports/TicketList.svg";
import callReportIcon from "../../assets/Reports/CallReport.svg";
import travelIcon from "../../assets/Reports/TravelLog.svg";
import expenseIcon from "../../assets/Reports/Expense.svg";
import billIcon from "../../assets/Reports/Bill.svg";
import incomeIcon from "../../assets/Reports/Income.svg";
import reportIcon from "../../assets/Reports/ItemWiseSale.svg";
import outstandingIcon from "../../assets/Reports/OutStanding.svg";
import repairIcon from "../../assets/Reports/RepairPart.svg";
import replaceIcon from "../../assets/Reports/ReplacePart.svg";
import attendanceIcon from "../../assets/Reports/AttendanceSummary.svg";
import receiptIcon from "../../assets/Reports/Receipt.svg";
import leaveApplicationIcon from "../../assets/Reports/LeaveApplication.svg";
import leaveApprovalIcon from "../../assets/Reports/LeaveApproval.svg";
import agentIcon from "../../assets/Reports/Agent.svg";
import historyIcon from "../../assets/Reports/TicketHistory.svg";

import { formatDateValue, getValue, text } from "./reportUtils";
import type {
  ReportDefinition,
  ReportKey,
} from "./reportTypes";

export const REPORTS = [
  { name: "Customer Details", icon: customerIcon, key: "customer" as const },
  { name: "Ticket List", icon: ticketIcon, key: "ticket" as const },
  { name: "Call Report", icon: callReportIcon, key: "call" as const },
  { name: "Travel Log", icon: travelIcon, key: "travel" as const },
  { name: "Expense", icon: expenseIcon, key: "expense" as const },
  { name: "Bill", icon: billIcon, key: "bill" as const },
  { name: "Item wise Sales", icon: reportIcon, key: "itemSales" as const },
  { name: "Outstanding", icon: outstandingIcon, key: "outstanding" as const },
  { name: "Part Taken for Repair", icon: repairIcon, key: "repairParts" as const },
  { name: "Replace Part", icon: replaceIcon, key: "replaceParts" as const },
  { name: "Receipt", icon: receiptIcon, key: "receipt" as const },
  { name: "Attendance Summary", icon: attendanceIcon, key: "attendance" as const },
  { name: "Leave Application", icon: leaveApplicationIcon, key: "leaveApplication" as const },
  { name: "Leave Approval Report", icon: leaveApprovalIcon, key: "leaveApproval" as const },
  { name: "Agent List Report", icon: agentIcon, key: "agentList" as const },
  { name: "Income vs Expense on Ticket", icon: incomeIcon, key: "incomeExpense" as const },
  { name: "Ticket History Report", icon: historyIcon, key: "ticketHistory" as const },
  { name: "Daily Service Report", icon: reportIcon, key: "dailyService" as const },
];

export const REPORT_DEFINITIONS: Record<ReportKey, ReportDefinition> = {
  customer: {
    key: "customer",
    title: "Customer Details Report",
    chipLabel: "Customer Details",
    icon: customerIcon,
    fileNamePrefix: "Customer_Details_Report",
    headers: ["Srl", "Customer Name", "Contact Person", "Mobile", "Email", "Address"],
    gridColumns: "60px 1.2fr 1fr 0.8fr 1fr 1.8fr",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        text(getValue(row, ["cCustomerName", "CustomerName", "cName"])),
        text(getValue(row, ["cContactPerson", "ContactPerson"])),
        text(getValue(row, ["cMobile", "cMobileNo", "Mobile", "cPhoneNo"])),
        text(getValue(row, ["cEmail", "Email"])),
        text(getValue(row, ["cAddress", "Address"])),
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  ticket: {
    key: "ticket",
    title: "Ticket List Report",
    chipLabel: "Ticket List",
    icon: ticketIcon,
    fileNamePrefix: "Ticket_List_Report",
    headers: [
      "Srl",
      "Ticket No.",
      "Date",
      "Customer Name",
      "Ticket Summary",
      "Assigned to",
      "Status",
    ],
    gridColumns: "50px 96px 120px 1.1fr 1.8fr 1fr 110px",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        text(getValue(row, ["nTicketNo"])),
        formatDateValue(
          getValue(row, ["dDate"]),
        ),
        text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
        text(
          getValue(row, [
            "cTicketSummary",
            "TicketSummary",
            "cDescription",
            "Description",
            "Summary",
          ]),
        ),
        text(getValue(row, ["cAssignedTo", "AssignedTo", "cAgentName", "AgentName"])),
        text(getValue(row, ["cTicketStatus", "cStatus", "Status", "StatusName"])),
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Ticket Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  call: {
    key: "call",
    title: "Call Report Report",
    chipLabel: "Call Report",
    icon: callReportIcon,
    fileNamePrefix: "Call_Report",
    headers: [
      "Agent",
      "Customer",
      "Call Report Summary",
      "Status",
      "Billed Amount",
      "Total Expense (Travel Exp. + Other Exp.)",
    ],
    gridColumns: "1fr 1fr 1.6fr 100px 120px 1.5fr",
    getRows: (rows) =>
      rows.map((row) => [
        text(getValue(row, ["cAgentName", "AgentName", "Agent"])),
        text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
        text(
          getValue(row, [
            "cCallreportSummary",
            "cCallReportSummary",
            "cTicketSummary",
            "CallSummary",
            "cCallSummary",
            "Summary",
            "cViewSummary",
          ]),
        ),
        text(getValue(row, ["cTicketStatus", "cStatus", "Status", "StatusName", "cClosedStatus"])),
        `Rs. ${Number(getValue(row, ["nBilledAmount", "BilledAmount", "nBillAmount"]) || 0).toFixed(2)}`,
        `Rs. ${Number(getValue(row, ["nTotalExpense", "TotalExpense", "nExpenseAmount", "nTravelAndOtherExpense"]) || 0).toFixed(2)}`,
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Call Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  travel: {
    key: "travel",
    title: "Travel Log Report",
    chipLabel: "Travel Log",
    icon: travelIcon,
    fileNamePrefix: "Travel_Log_Report",
    headers: ["Srl", "Call Report No.", "Date", "Customer", "Starting Location", "Check In Location", "Check In Time", "Distance Travelled"],
    gridColumns: "50px 120px 110px 1fr 1.2fr 1.2fr 110px 120px",
    getRows: (rows) =>
      rows.map((row, index) => [
        String(index + 1),
        text(getValue(row, ["nCallReportNo", "cCallReportNo", "nCallReportId", "CallReportNo"])),
        formatDateValue(getValue(row, ["dDate", "cDate", "Date", "dCreatedDate"])),
        text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
        text(getValue(row, ["cStartingLocation", "StartLocation", "cStartLocation"])),
        text(getValue(row, ["cCheckinLocation", "cCheckInLocation", "CheckInLocation", "EndLocation"])),
        text(getValue(row, ["cCheckinTime", "cCheckInTime", "CheckInTime", "dCheckInTime"])),
        text(getValue(row, ["nTravelledKm", "nCalculatedDistance", "nDistance"]), "0"),
      ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  expense: {
    key: "expense",
    title: "Expense Report",
    chipLabel: "Expense",
    icon: expenseIcon,
    fileNamePrefix: "Expense_Report",
    headers: ["Srl", "Call Report Ref No.", "Date", "Description", "Amount", "Comment"],
    gridColumns: "50px 140px 120px 1.8fr 110px 1.3fr",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1),
      text(getValue(row, ["nCallReportRefNo", "cCallReportRefNo", "nCallReportId", "CallReportRefNo"])),
      formatDateValue(getValue(row, ["dDate", "dExpenseDate", "Date", "dCreatedDate"])),
      text(getValue(row, ["cDescription", "Description", "cExpenseDescription"])),
      `Rs. ${Number(getValue(row, ["nAmount", "Amount", "nExpenseAmount"]) || 0).toFixed(2)}`,
      text(getValue(row, ["cComment", "Comment", "cRemarks", "Remarks"])),
    ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  bill: {
    key: "bill",
    title: "Bill Report",
    chipLabel: "Bill",
    icon: billIcon,
    fileNamePrefix: "Bill_Report",
    headers: ["Srl", "Month", "Item Total", "Discount", "Tax Amount", "RoundOff", "Bill Total", "Cash"],
    gridColumns: "50px 1fr 110px 100px 110px 100px 110px 100px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1),
      text(getValue(row, ["cMonth", "Month", "cDate", "Date", "dDate", "cPeriod", "Period"])),
      `Rs. ${Number(getValue(row, ["nItemTotal", "ItemTotal"]) || 0).toFixed(2)}`,
      `Rs. ${Number(getValue(row, ["nDiscount", "Discount", "nDiscountAmount"]) || 0).toFixed(2)}`,
      `Rs. ${Number(getValue(row, ["nTaxAmount", "TaxAmount"]) || 0).toFixed(2)}`,
      `Rs. ${Number(getValue(row, ["nRoundOff", "RoundOff"]) || 0).toFixed(2)}`,
      `Rs. ${Number(getValue(row, ["nBillTotal", "BillTotal", "nTotalAmount"]) || 0).toFixed(2)}`,
      `Rs. ${Number(getValue(row, ["nCash", "Cash", "nCashAmount"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  itemSales: {
    key: "itemSales",
    title: "Item wise Sales Report",
    chipLabel: "Item wise Sales",
    icon: reportIcon,
    fileNamePrefix: "Item_Wise_Sales_Report",
    headers: ["Srl", "Item", "Qty", "Rate", "Item Total", "Discount", "Tax", "Value"],
    gridColumns: "50px 1.5fr 80px 100px 110px 100px 100px 110px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1),
      text(getValue(row, ["cPartName", "PartName", "cItemName", "ItemName", "Item"])),
      text(getValue(row, ["nQty", "Qty", "nQuantity", "Quantity"]), "0"),
      `₹ ${Number(getValue(row, ["nRate", "Rate"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nItemTotal", "ItemTotal"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nDiscount", "Discount", "nDiscountAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nTax", "Tax", "nTaxAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nValue", "Value", "nNetAmount"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) =>
      `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  outstanding: {
    key: "outstanding", title: "Outstanding Report", chipLabel: "Outstanding", icon: outstandingIcon,
    fileNamePrefix: "Outstanding_Report",
    headers: ["Srl", "Customer", "Bill Amount", "Amount Paid", "Outstanding Total"],
    gridColumns: "50px 1.5fr 130px 130px 150px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
      `₹ ${Number(getValue(row, ["nBillAmount", "BillAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nAmountPaid", "AmountPaid", "nPaidAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nOutstandingTotal", "OutstandingTotal", "nBalanceAmount"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) => `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  repairParts: {
    key: "repairParts", title: "Part Taken for Repair Report", chipLabel: "Part Taken for Repair", icon: repairIcon,
    fileNamePrefix: "Repair_Parts_Report",
    headers: ["Srl", "Call Report No.", "Date", "Customer", "Part Name", "Qty", "Returned (Y/N)"],
    gridColumns: "50px 120px 110px 1.2fr 1.3fr 70px 120px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["nCallReportNo", "cCallReportNo", "CallReportNo", "nCallReportId"])),
      formatDateValue(getValue(row, ["dDate", "Date", "dCreatedDate"])), text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
      text(getValue(row, ["cPartName", "PartName", "cItemName"])), text(getValue(row, ["nQty", "Qty", "nQuantity"]), "0"),
      text(getValue(row, ["cReturned", "Returned", "bReturned", "ReturnStatus"])),
    ]),
    getFilterText: (filter) => `Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  replaceParts: {
    key: "replaceParts", title: "Replace Part Report", chipLabel: "Replace Part", icon: replaceIcon,
    fileNamePrefix: "Replace_Parts_Report",
    headers: ["Srl", "Call Report No.", "Date", "Customer", "Part Name", "Qty", "Rate", "Amount"],
    gridColumns: "50px 120px 110px 1.2fr 1.3fr 70px 100px 110px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["nCallReportNo", "cCallReportNo", "CallReportNo", "nCallReportId"])),
      formatDateValue(getValue(row, ["dDate", "Date", "dCreatedDate"])), text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
      text(getValue(row, ["cPartName", "PartName", "cItemName"])), text(getValue(row, ["nQty", "Qty", "nQuantity"]), "0"),
      `₹ ${Number(getValue(row, ["nRate", "Rate"]) || 0).toFixed(2)}`, `₹ ${Number(getValue(row, ["nAmount", "Amount", "nValue"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) => `Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  receipt: {
    key: "receipt", title: "Receipt Report", chipLabel: "Receipt", icon: receiptIcon,
    fileNamePrefix: "Receipt_Report", headers: ["Srl", "Month", "Cash", "Other", "Amount"],
    gridColumns: "50px 1.3fr 130px 130px 140px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["cMonth", "Month", "cDate", "Date", "dDate", "cPeriod", "Period"])),
      `₹ ${Number(getValue(row, ["nCash", "Cash", "nCashAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nOther", "Other", "nOtherAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nAmount", "Amount", "nTotalAmount"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) => `Company : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  attendance: {
    key: "attendance", title: "Attendance Summary Report", chipLabel: "Attendance Summary", icon: attendanceIcon,
    fileNamePrefix: "Attendance_Summary_Report", headers: ["Srl", "Date", "Agent", "Punch In", "Punch Out", "Working Hours"],
    gridColumns: "50px 120px 1.3fr 120px 120px 130px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), formatDateValue(getValue(row, ["dDate", "Date", "dAttendanceDate"])), text(getValue(row, ["cAgentName", "AgentName", "Agent"])),
      text(getValue(row, ["cPunchIn", "PunchIn", "dPunchIn"])), text(getValue(row, ["cPunchOut", "PunchOut", "dPunchOut"])), text(getValue(row, ["cWorkingHours", "WorkingHours", "nWorkingHours"])),
    ]),
    getFilterText: (filter) => `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  leaveApplication: {
    key: "leaveApplication", title: "Leave Application Report", chipLabel: "Leave Application", icon: leaveApplicationIcon,
    fileNamePrefix: "Leave_Application_Report", headers: ["Srl", "Ref No", "Agent", "Leave from", "Leave to", "No. of days", "Reason"],
    gridColumns: "50px 110px 1.2fr 120px 120px 100px 1.5fr",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["cRefNo", "RefNo", "nLeaveApplicationId"])), text(getValue(row, ["cAgentName", "AgentName", "Agent"])),
      formatDateValue(getValue(row, ["dLeaveFrom", "LeaveFrom", "dFromDate"])), formatDateValue(getValue(row, ["dLeaveTo", "LeaveTo", "dToDate"])),
      text(getValue(row, ["nNoOfDays", "NoOfDays", "nDays"]), "0"), text(getValue(row, ["cReason", "Reason", "cRemarks"])),
    ]),
    getFilterText: (filter) => `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  leaveApproval: {
    key: "leaveApproval", title: "Leave Approval Report", chipLabel: "Leave Approval Report", icon: leaveApprovalIcon,
    fileNamePrefix: "Leave_Approval_Report",
    headers: ["Srl", "Ref No.", "Agent", "From Date", "To Date", "Reason", "Approved by", "Approved Date"],
    gridColumns: "50px 100px 1fr 110px 110px 1.3fr 1fr 120px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["cRefNo", "RefNo", "nLeaveApplicationId"])), text(getValue(row, ["cAgentName", "AgentName", "Agent"])),
      formatDateValue(getValue(row, ["dLeaveFrom", "LeaveFrom", "dFromDate"])), formatDateValue(getValue(row, ["dLeaveTo", "LeaveTo", "dToDate"])),
      text(getValue(row, ["cReason", "Reason", "cRemarks"])), text(getValue(row, ["cApprovedBy", "ApprovedBy", "cApproverName"])),
      formatDateValue(getValue(row, ["dApprovedDate", "ApprovedDate", "dApprovalDate"])),
    ]),
    getFilterText: (filter) => `Company Name : ${filter.company.label}, Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  agentList: {
    key: "agentList", title: "Agent List Report", chipLabel: "Agent List Report", icon: agentIcon,
    fileNamePrefix: "Agent_List_Report", headers: ["Srl", "Agent", "Mobile No.", "Email", "Group Name", "Role"],
    gridColumns: "50px 1.2fr 120px 1.5fr 1.2fr 110px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["cAgentName", "AgentName", "cName", "Name"])), text(getValue(row, ["cMobileNo", "MobileNo", "cMobile"])),
      text(getValue(row, ["cEmail", "Email"])), text(getValue(row, ["cGroupName", "GroupName", "Group"])), text(getValue(row, ["cRoleName", "RoleName", "Role"])),
    ]),
    getFilterText: (filter) => `Company : ${filter.company.label}`,
  },
  incomeExpense: {
    key: "incomeExpense", title: "Income vs Expense on Ticket Report", chipLabel: "Income vs Expense on Ticket", icon: incomeIcon,
    fileNamePrefix: "Income_Expense_Report", headers: ["Srl", "Ticket No.", "Customer Name", "Visit / Calls", "Status", "Billed Amount", "Expense"],
    gridColumns: "50px 110px 1.3fr 120px 110px 130px 120px",
    getRows: (rows) => rows.map((row, index) => [
      String(index + 1), text(getValue(row, ["nTicketNo", "TicketNo", "cTicketNo"])), text(getValue(row, ["cCustomerName", "CustomerName", "Customer"])),
      text(getValue(row, ["nVisitCalls", "VisitCalls", "nVisits"]), "0"), text(getValue(row, ["cStatus", "Status", "cTicketStatus"])),
      `₹ ${Number(getValue(row, ["nBilledAmount", "BilledAmount", "nBillAmount"]) || 0).toFixed(2)}`, `₹ ${Number(getValue(row, ["nExpense", "Expense", "nExpenseAmount"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) => `Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  ticketHistory: {
    key: "ticketHistory", title: "Ticket History Report", chipLabel: "Ticket History Report", icon: historyIcon,
    fileNamePrefix: "Ticket_History_Report", headers: ["Date", "Type", "Details"], gridColumns: "170px 160px 1fr",
    getRows: (rows) => rows.map((row) => [
      text(getValue(row, ["dDate", "Date", "dCreatedDate", "CreatedDate"])), text(getValue(row, ["cType", "Type", "cAction", "Action"])),
      text(getValue(row, ["cDetails", "Details", "cDescription", "Description", "cRemarks", "Remarks"])),
    ]),
    getFilterText: (filter) => `Date : ${filter.from.format("DD/MM/YYYY")} to ${filter.to.format("DD/MM/YYYY")}`,
  },
  dailyService: {
    key: "dailyService", title: "Daily Service Report", chipLabel: "Daily Service Report", icon: reportIcon,
    fileNamePrefix: "Daily_Service_Report", headers: ["Agent", "Date", "Punch In", "Punch Out", "Total Working Hrs", "Call Reports", "Created Tickets", "Bill Amount", "Receipt Amount"],
    gridColumns: "1.2fr 110px 100px 100px 120px 100px 110px 120px 120px",
    getRows: (rows) => rows.map((row) => [
      text(getValue(row, ["cAgentName", "AgentName", "Agent"])), formatDateValue(getValue(row, ["dDate", "Date"])), text(getValue(row, ["cPunchIn", "PunchIn"])),
      text(getValue(row, ["cPunchOut", "PunchOut"])), text(getValue(row, ["cWorkingHours", "WorkingHours"])), text(getValue(row, ["nCallReportCount", "CallReportCount"]), "0"),
      text(getValue(row, ["nCreatedTicketCount", "CreatedTicketCount"]), "0"), `₹ ${Number(getValue(row, ["nBillAmount", "BillAmount"]) || 0).toFixed(2)}`,
      `₹ ${Number(getValue(row, ["nReceiptAmount", "ReceiptAmount"]) || 0).toFixed(2)}`,
    ]),
    getFilterText: (filter) => `Date : ${filter.from.format("DD/MM/YYYY")}`,
  },
};

