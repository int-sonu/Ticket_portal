import {
  type Dispatch,
  type SetStateAction,
} from "react";
import { Checkbox, Modal, Select, Spin } from "antd";
import {
  CalendarOutlined,
  CloseOutlined,
  RightOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";

import {
  REPORT_DEFINITIONS,
} from "./reportDefinitions";
import {
  isExtraReportKey,
} from "./reportUtils";
import { ReportDateRangeFields } from "./ReportDateRangeFields";
import type {
  BillFilterDraft,
  CallFilterDraft,
  CompanyOption,
  ExpenseFilterDraft,
  ExtraFilterDraft,
  ExtraReportKey,
  ItemSalesFilterDraft,
  ReportKey,
  SelectOption,
  TicketFilterDraft,
  TravelFilterDraft,
} from "./reportTypes";

type ReportFilterModalProps = {
  filterOpen: boolean;
  setFilterOpen: Dispatch<SetStateAction<boolean>>;
  handleCancelFilter: () => void;
  pendingReportKey: ReportKey;
  filterMode: ReportKey;
  filterOptionsLoading: boolean;
  companyId: string;
  setCompanyId: Dispatch<SetStateAction<string>>;
  selectedCompany?: CompanyOption;
  companySelectOptions: SelectOption[];
  fromDate: Dayjs;
  toDate: Dayjs;
  setDateFieldOpen: Dispatch<SetStateAction<"from" | "to" | null>>;
  setCalendarMonth: Dispatch<SetStateAction<Dayjs>>;
  ticketDraft: TicketFilterDraft;
  setTicketDraft: Dispatch<SetStateAction<TicketFilterDraft>>;
  callDraft: CallFilterDraft;
  setCallDraft: Dispatch<SetStateAction<CallFilterDraft>>;
  travelDraft: TravelFilterDraft;
  setTravelDraft: Dispatch<SetStateAction<TravelFilterDraft>>;
  expenseDraft: ExpenseFilterDraft;
  setExpenseDraft: Dispatch<SetStateAction<ExpenseFilterDraft>>;
  billDraft: BillFilterDraft;
  setBillDraft: Dispatch<SetStateAction<BillFilterDraft>>;
  itemSalesDraft: ItemSalesFilterDraft;
  setItemSalesDraft: Dispatch<SetStateAction<ItemSalesFilterDraft>>;
  setExtraDrafts: Dispatch<SetStateAction<Record<ExtraReportKey, ExtraFilterDraft>>>;
  activeExtraModalDraft: ExtraFilterDraft | null;
  updateActiveExtraDraft: (changes: Partial<ExtraFilterDraft>) => void;
  agentSelectOptions: SelectOption[];
  customerSelectOptions: SelectOption[];
  partSelectOptions: SelectOption[];
  replaceCustomerOptions: SelectOption[];
  replaceAgentOptions: SelectOption[];
  leaveApprovalAgentOptions: SelectOption[];
  ticketNumberOptions: SelectOption[];
  applyFilter: () => void;
};

const ReportFilterModal = ({
  filterOpen,
  setFilterOpen,
  handleCancelFilter,
  pendingReportKey,
  filterMode,
  filterOptionsLoading,
  companyId,
  setCompanyId,
  selectedCompany,
  companySelectOptions,
  fromDate,
  toDate,
  setDateFieldOpen,
  setCalendarMonth,
  ticketDraft,
  setTicketDraft,
  callDraft,
  setCallDraft,
  travelDraft,
  setTravelDraft,
  expenseDraft,
  setExpenseDraft,
  billDraft,
  setBillDraft,
  itemSalesDraft,
  setItemSalesDraft,
  setExtraDrafts,
  activeExtraModalDraft,
  updateActiveExtraDraft,
  agentSelectOptions,
  customerSelectOptions,
  partSelectOptions,
  replaceCustomerOptions,
  replaceAgentOptions,
  leaveApprovalAgentOptions,
  ticketNumberOptions,
  applyFilter,
}: ReportFilterModalProps) => (
<Modal
  open={filterOpen}
  onCancel={() => {
    setFilterOpen(false);
    handleCancelFilter();
  }}
  footer={null}
  title={REPORT_DEFINITIONS[pendingReportKey].title}
  width={400}
  centered
  closeIcon={<CloseOutlined />}
>
  <Spin spinning={filterOptionsLoading}>
    <div className="pt-2">
      {!(["repairParts", "replaceParts", "incomeExpense", "ticketHistory", "dailyService"] as ReportKey[]).includes(filterMode) ? (
        <>
          <label className="mb-1 block text-xs text-slate-500">Company Name</label>
          <Select
        value={
          filterMode === "ticket"
            ? ticketDraft.companyId || selectedCompany?.value
            : filterMode === "call"
              ? callDraft.companyId || selectedCompany?.value
              : filterMode === "travel"
                ? travelDraft.companyId || selectedCompany?.value
                : filterMode === "expense"
                  ? expenseDraft.companyId || selectedCompany?.value
                  : filterMode === "bill"
                    ? billDraft.companyId || selectedCompany?.value
                    : filterMode === "itemSales"
                      ? itemSalesDraft.companyId || selectedCompany?.value
                      : activeExtraModalDraft
                        ? activeExtraModalDraft.companyId || selectedCompany?.value
              : companyId || selectedCompany?.value
        }
        onChange={(value) => {
          setCompanyId(value);
          setTicketDraft((current) => ({ ...current, companyId: value }));
          setCallDraft((current) => ({ ...current, companyId: value }));
          setTravelDraft((current) => ({ ...current, companyId: value }));
          setExpenseDraft((current) => ({ ...current, companyId: value }));
          setBillDraft((current) => ({ ...current, companyId: value }));
          setItemSalesDraft((current) => ({ ...current, companyId: value }));
          if (isExtraReportKey(filterMode)) {
            setExtraDrafts((current) => ({ ...current, [filterMode]: { ...current[filterMode], companyId: value } }));
          }
        }}
        options={companySelectOptions}
        suffixIcon={<RightOutlined />}
        className="w-full"
            placeholder="Select company"
          />
        </>
      ) : null}

      {filterMode === "customer" ? (
        <>
          <h3 className="mb-3 mt-2 text-sm font-medium text-slate-800">Created Date</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("from");
                setCalendarMonth(fromDate.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              {fromDate.format("DD/MM/YYYY")}
              <CalendarOutlined className="text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("to");
                setCalendarMonth(toDate.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              {toDate.format("DD/MM/YYYY")}
              <CalendarOutlined className="text-slate-500" />
            </button>
          </div>
        </>
      ) : null}

      {filterMode === "travel" ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Agent</label>
            <Select
              value={travelDraft.agentId}
              onChange={(value) => setTravelDraft((current) => ({ ...current, agentId: value }))}
              options={agentSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <h3 className="mb-3 text-sm font-medium text-slate-800">Date</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("from");
                setCalendarMonth(travelDraft.from.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              <span>From {travelDraft.from.format("DD/MM/YYYY")}</span>
              <CalendarOutlined className="text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("to");
                setCalendarMonth(travelDraft.to.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              <span>To {travelDraft.to.format("DD/MM/YYYY")}</span>
              <CalendarOutlined className="text-slate-500" />
            </button>
          </div>
        </div>
      ) : null}

      {filterMode === "expense" ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Agent</label>
            <Select
              value={expenseDraft.agentId}
              onChange={(value) => setExpenseDraft((current) => ({ ...current, agentId: value }))}
              options={agentSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <ReportDateRangeFields
            from={expenseDraft.from}
            to={expenseDraft.to}
            onFrom={() => { setDateFieldOpen("from"); setCalendarMonth(expenseDraft.from.startOf("month")); }}
            onTo={() => { setDateFieldOpen("to"); setCalendarMonth(expenseDraft.to.startOf("month")); }}
          />
        </div>
      ) : null}

      {filterMode === "bill" ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Report Type</label>
            <Select
              value={billDraft.reportType}
              onChange={(value) => setBillDraft((current) => ({ ...current, reportType: value }))}
              options={[
                { label: "Summary", value: "Summary" },
                { label: "Detail", value: "Detail" },
              ]}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Summary Level</label>
            <Select
              value={billDraft.summaryLevel}
              onChange={(value) => setBillDraft((current) => ({ ...current, summaryLevel: value }))}
              options={[
                { label: "Month wise", value: "Month wise" },
                { label: "Day wise", value: "Day wise" },
              ]}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <ReportDateRangeFields
            from={billDraft.from}
            to={billDraft.to}
            onFrom={() => { setDateFieldOpen("from"); setCalendarMonth(billDraft.from.startOf("month")); }}
            onTo={() => { setDateFieldOpen("to"); setCalendarMonth(billDraft.to.startOf("month")); }}
          />
        </div>
      ) : null}

      {filterMode === "itemSales" ? (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Customer</label>
            <Select
              value={itemSalesDraft.customerId}
              onChange={(value) => setItemSalesDraft((current) => ({ ...current, customerId: value }))}
              options={customerSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Item</label>
            <Select
              value={itemSalesDraft.itemId}
              onChange={(value) => setItemSalesDraft((current) => ({ ...current, itemId: value }))}
              options={partSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <ReportDateRangeFields
            from={itemSalesDraft.from}
            to={itemSalesDraft.to}
            onFrom={() => { setDateFieldOpen("from"); setCalendarMonth(itemSalesDraft.from.startOf("month")); }}
            onTo={() => { setDateFieldOpen("to"); setCalendarMonth(itemSalesDraft.to.startOf("month")); }}
          />
        </div>
      ) : null}

      {activeExtraModalDraft ? (
        <div className="mt-3 space-y-3">
          {filterMode === "receipt" ? (
            <>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Report Type</label>
                <Select value={activeExtraModalDraft.reportType} onChange={(value) => updateActiveExtraDraft({ reportType: value })} options={[{ label: "Summary", value: "Summary" }, { label: "Detail", value: "Detail" }]} suffixIcon={<RightOutlined />} className="w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Summary Level</label>
                <Select value={activeExtraModalDraft.summaryLevel} onChange={(value) => updateActiveExtraDraft({ summaryLevel: value })} options={[{ label: "Month wise", value: "Month wise" }, { label: "Day wise", value: "Day wise" }]} suffixIcon={<RightOutlined />} className="w-full" />
              </div>
            </>
          ) : null}

          {filterMode === "incomeExpense" ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Date Type</label>
              <Select value={activeExtraModalDraft.dateType} onChange={(value) => updateActiveExtraDraft({ dateType: value })} options={[{ label: "Created Date", value: "Created Date" }, { label: "Closed Date", value: "Closed Date" }]} suffixIcon={<RightOutlined />} className="w-full" />
            </div>
          ) : null}

          {filterMode !== "agentList" && filterMode !== "dailyService" ? (
            <ReportDateRangeFields
              from={activeExtraModalDraft.from}
              to={activeExtraModalDraft.to}
              onFrom={() => { setDateFieldOpen("from"); setCalendarMonth(activeExtraModalDraft.from.startOf("month")); }}
              onTo={() => { setDateFieldOpen("to"); setCalendarMonth(activeExtraModalDraft.to.startOf("month")); }}
            />
          ) : null}

          {filterMode === "dailyService" ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Agent</label>
              <Select mode="multiple" value={activeExtraModalDraft.agentIds} onChange={(value) => updateActiveExtraDraft({ agentIds: value })} options={agentSelectOptions.filter((option) => option.value)} suffixIcon={<RightOutlined />} className="w-full" />
            </div>
          ) : null}

          {filterMode === "dailyService" ? (
            <div className="grid grid-cols-[1fr_auto] items-end gap-4">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Date <span className="text-red-500">*</span></label>
                <button type="button" onClick={() => { setDateFieldOpen("from"); setCalendarMonth(activeExtraModalDraft.from.startOf("month")); }} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm">
                  {activeExtraModalDraft.from.format("DD/MM/YYYY")}<CalendarOutlined className="text-slate-500" />
                </button>
              </div>
              <Checkbox checked={activeExtraModalDraft.detailedTravelExpense} onChange={(event) => updateActiveExtraDraft({ detailedTravelExpense: event.target.checked })}>Detailed Traveling Expense</Checkbox>
            </div>
          ) : null}

          {["outstanding", "repairParts", "replaceParts", "receipt", "incomeExpense", "ticketHistory"].includes(filterMode) ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Customer</label>
              <Select
                value={activeExtraModalDraft.customerId}
                onChange={(value) => updateActiveExtraDraft({ customerId: value })}
                options={filterMode === "replaceParts" ? replaceCustomerOptions : customerSelectOptions}
                suffixIcon={<RightOutlined />}
                className="w-full"
              />
            </div>
          ) : null}

          {["replaceParts", "receipt", "attendance", "leaveApplication", "leaveApproval", "agentList", "incomeExpense", "ticketHistory"].includes(filterMode) ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Agent</label>
              <Select
                value={activeExtraModalDraft.agentId}
                onChange={(value) => updateActiveExtraDraft({ agentId: value })}
                options={filterMode === "replaceParts" ? replaceAgentOptions : filterMode === "leaveApproval" ? leaveApprovalAgentOptions : agentSelectOptions}
                suffixIcon={<RightOutlined />}
                className="w-full"
              />
            </div>
          ) : null}

          {filterMode === "ticketHistory" ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Ticket No.</label>
              <Select value={activeExtraModalDraft.ticketId} onChange={(value) => updateActiveExtraDraft({ ticketId: value })} options={ticketNumberOptions} suffixIcon={<RightOutlined />} className="w-full" />
            </div>
          ) : null}

          {filterMode === "repairParts" ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Return Status</label>
              <Select value={activeExtraModalDraft.returnStatus} onChange={(value) => updateActiveExtraDraft({ returnStatus: value })} options={[{ label: "All", value: "All" }, { label: "Returned", value: "Returned" }, { label: "Not Returned", value: "Not Returned" }]} suffixIcon={<RightOutlined />} className="w-full" />
            </div>
          ) : null}

          {filterMode === "leaveApplication" ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <Select value={activeExtraModalDraft.status} onChange={(value) => updateActiveExtraDraft({ status: value })} options={[{ label: "Approved", value: "Approved" }, { label: "Pending", value: "Pending" }, { label: "Rejected", value: "Rejected" }, { label: "All", value: "All" }]} suffixIcon={<RightOutlined />} className="w-full" />
            </div>
          ) : null}

          {filterMode === "incomeExpense" ? (
            <div>
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <Select value={activeExtraModalDraft.status} onChange={(value) => updateActiveExtraDraft({ status: value })} options={[{ label: "All", value: "All" }, { label: "Open", value: "Open" }, { label: "Closed", value: "Closed" }]} suffixIcon={<RightOutlined />} className="w-full" />
            </div>
          ) : null}
        </div>
      ) : null}

      {filterMode === "ticket" ? (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Ticket Type</label>
              <Select
                value={ticketDraft.ticketType}
                onChange={(value) => setTicketDraft((current) => ({ ...current, ticketType: value }))}
                options={[
                  { label: "All", value: "All" },
                  { label: "Open", value: "Open" },
                  { label: "Closed", value: "Closed" },
                ]}
                suffixIcon={<RightOutlined />}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Date Type</label>
              <Select
                value={ticketDraft.dateType}
                onChange={(value) => setTicketDraft((current) => ({ ...current, dateType: value }))}
                options={[
                  { label: "Created Date", value: "Created Date" },
                  { label: "Closed Date", value: "Closed Date" },
                  { label: "Scheduled Date", value: "Scheduled Date" },
                ]}
                suffixIcon={<RightOutlined />}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("from");
                setCalendarMonth(ticketDraft.from.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              <span>From {ticketDraft.from.format("DD/MM/YYYY")}</span>
              <CalendarOutlined className="text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("to");
                setCalendarMonth(ticketDraft.to.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              <span>To {ticketDraft.to.format("DD/MM/YYYY")}</span>
              <CalendarOutlined className="text-slate-500" />
            </button>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Customer</label>
            <Select
              value={ticketDraft.customerId}
              onChange={(value) => setTicketDraft((current) => ({ ...current, customerId: value }))}
              options={customerSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Assigned To</label>
            <Select
              value={ticketDraft.assignedTo}
              onChange={(value) => setTicketDraft((current) => ({ ...current, assignedTo: value }))}
              options={agentSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Created By</label>
            <Select
              value={ticketDraft.createdBy}
              onChange={(value) => setTicketDraft((current) => ({ ...current, createdBy: value }))}
              options={agentSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Priority</label>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-200">
              {["All", "Low", "Medium", "High"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTicketDraft((current) => ({ ...current, priority: item }))}
                  className={`min-w-[62px] border-r border-slate-200 px-3 py-1.5 text-sm last:border-r-0 ${
                    ticketDraft.priority === item
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Ticket Stage</label>
            <Select
              value={ticketDraft.ticketStage}
              onChange={(value) => setTicketDraft((current) => ({ ...current, ticketStage: value }))}
              options={[
                { label: "All", value: "All" },
                { label: "Open", value: "Open" },
                { label: "In Progress", value: "In Progress" },
                { label: "Closed", value: "Closed" },
              ]}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
        </div>
      ) : null}

      {filterMode === "call" ? (
        <div className="mt-3 space-y-3">
          <h3 className="mb-3 text-sm font-medium text-slate-800">Date</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("from");
                setCalendarMonth(callDraft.from.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              <span>From {callDraft.from.format("DD/MM/YYYY")}</span>
              <CalendarOutlined className="text-slate-500" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFieldOpen("to");
                setCalendarMonth(callDraft.to.startOf("month"));
              }}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm"
            >
              <span>To {callDraft.to.format("DD/MM/YYYY")}</span>
              <CalendarOutlined className="text-slate-500" />
            </button>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Agent</label>
            <Select
              value={callDraft.agentId}
              onChange={(value) => setCallDraft((current) => ({ ...current, agentId: value }))}
              options={agentSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Customer</label>
            <Select
              value={callDraft.customerId}
              onChange={(value) => setCallDraft((current) => ({ ...current, customerId: value }))}
              options={customerSelectOptions}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <Select
              value={callDraft.status}
              onChange={(value) => setCallDraft((current) => ({ ...current, status: value }))}
              options={[
                { label: "All", value: "All" },
                { label: "Open", value: "Open" },
                { label: "Closed", value: "Closed" },
              ]}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Bill Status</label>
            <Select
              value={callDraft.billStatus}
              onChange={(value) => setCallDraft((current) => ({ ...current, billStatus: value }))}
              options={[
                { label: "All", value: "All" },
                { label: "Billed", value: "Billed" },
                { label: "Unbilled", value: "Unbilled" },
              ]}
              suffixIcon={<RightOutlined />}
              className="w-full"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={applyFilter}
          className="h-8 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Apply
        </button>
      </div>
    </div>
  </Spin>
</Modal>

);

export default ReportFilterModal;
