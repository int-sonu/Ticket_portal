import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  DatePicker,
  Drawer,
  Empty,
  Image,
  Input,
  Spin,
  Upload,
  message,
} from "antd";
import {
  CalendarOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";

import { billingApis } from "../../Axios/BillingApis";
import { agentApis } from "../../Axios/MasterApis";
import { extractList } from "../Master/Common/SimpleMasterUtils";
import { getRequestPayload } from "../../Utils/requestPayload";
import DateFilterIconPopover from "../../ui/CalendarPopup/DateFilterIconPopover";
import year from "../../assets/icons/year.svg";
import deleteImage from "../../assets/icons/delete-white.svg";
import AgentSelectorModal from "./AgentSelectorModal";

type RecordLike = Record<string, any>;

type AgentOption = {
  label: string;
  value: string;
  role?: string;
  isSelf?: boolean;
};

type ExpenseAttachment = {
  id: string;
  file: File;
  url: string;
};

const text = (value: unknown, fallback = "") =>
  String(value ?? "").trim() || fallback;

const normalize = (value: unknown) => text(value).toLowerCase();

const number = (value: unknown, fallback = 0) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getValue = (record: RecordLike, keys: string[]) => {
  if (!record || typeof record !== "object") return "";

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }

  const entries = Object.entries(record);
  for (const key of keys) {
    const lower = key.toLowerCase();
    const match = entries.find(([entryKey, entryValue]) => {
      if (entryValue === undefined || entryValue === null || entryValue === "") return false;
      return entryKey.toLowerCase() === lower;
    });
    if (match) return match[1];
  }

  return "";
};

const extractRows = (response: unknown) => {
  const rows = extractList(response);
  if (rows.length) return rows as RecordLike[];
  if (!response || typeof response !== "object") return [];

  const source = response as RecordLike;
  for (const nested of [
    source.data,
    source.result,
    source.items,
    source.list,
    source.TravelExpenseList,
    source.travelExpenseList,
    source.OtherExpenseList,
    source.otherExpenseList,
  ]) {
    const list = extractList(nested);
    if (list.length) return list as RecordLike[];
  }

  return [];
};

const getTravelDate = (row: RecordLike) =>
  text(getValue(row, ["dCreatedDate"]));

const getAgentName = (row: RecordLike) =>
  text(getValue(row, ["cAgentName"]));

const getExpenseAmount = (row: RecordLike) =>
  number(getValue(row, ["nOtherExpenseAmount"]), 0);

const parseExpenseDate = (value: unknown) => {
  if (!value) return null;

  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value : null;
  }

  if (value instanceof Date) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }

  const textValue = String(value).trim();
  if (!textValue) return null;

  const direct = dayjs(textValue);
  if (direct.isValid()) {
    return direct;
  }

  const dateOnlyMatch = textValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dateOnlyMatch) {
    const [, day, month, year] = dateOnlyMatch;
    const parsed = dayjs(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
    return parsed.isValid() ? parsed : null;
  }

  return null;
};

const getDropdownValue = (row: RecordLike, labelKeys: string[], valueKeys: string[]) => ({
  label: text(getValue(row, labelKeys), ""),
  value: text(getValue(row, valueKeys), ""),
});

const getRoleLabel = (value: unknown, isSelf = false) => {
  if (isSelf) return "Admin";

  const type = String(value ?? "").trim();
  if (type === "1") return "Agent";
  if (type === "2") return "Supervisor";
  if (type === "3") return "Agent";

  return "Agent";
};

const getAgentSubtitle = (row: RecordLike, fallback = "Agent") => {
  const type = getValue(row, ["nType", "nUserType", "cUserType", "userType", "Role"]);
  const role = text(
    getValue(row, ["cTypeName", "cUserType", "userType", "Role"]),
    getRoleLabel(type, false),
  );

  return role || fallback;
};

const safeParse = (value: string | null) => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const getCurrentUser = () => {
  const creds = safeParse(localStorage.getItem("userCredentials"));
  const session = safeParse(sessionStorage.getItem("userSession"));
  const source = {
    ...(creds?.data ?? creds ?? {}),
    ...(session?.data ?? session ?? {}),
  };

  const name =
    text(
      source?.cName ??
        source?.cAgentName ??

      "Testing Team",
    ) || "Testing Team";

  const shortName = text(
    source?.cShortName ?? source?.shortName ?? name.slice(0, 1),
    name.slice(0, 1) || "S",
  );

  return {
    id: Number(source?.nAgentId ?? source?.agentId ?? source?.id ?? 0) || 0,
    name,
    shortName,
    role: text(source?.cUserType ?? source?.userType ?? source?.nType ?? "Self"),
    nType: Number(source?.nType ?? 0) || 0,
  };
};

const TravelingExpenseModalPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state ?? {}) as Record<string, any>;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const initialDate = locationState.selectedDate ? dayjs(locationState.selectedDate) : dayjs();
    return initialDate.isValid() ? initialDate : dayjs();
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSelectedDate, setDraftSelectedDate] = useState(selectedDate.toDate());
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentOption | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | undefined>();
  const [comment, setComment] = useState("");
  const [amount, setAmount] = useState<string>("0");
  const [attachments, setAttachments] = useState<ExpenseAttachment[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [locallySavedExpenses, setLocallySavedExpenses] = useState<RecordLike[]>([]);
  const attachmentStripRef = useRef<HTMLDivElement>(null);
  const currentUser = useMemo(() => getCurrentUser(), []);

  const requestPayload = useMemo(
    () => {
      const request = getRequestPayload();
      return {
        ...request,
        cAgentId: String(
          selectedAgent?.value || request.nAgentId || request.id || currentUser.id || "",
        ),
        dFromDate: selectedDate.startOf("month").format("YYYY-MM-DD"),
        dToDate: selectedDate.endOf("month").format("YYYY-MM-DD"),
        pageNumber: 1,
        pageSize: 1,
      };
    },
    [currentUser.id, selectedAgent?.value, selectedDate],
  );

  const {
    data: travelExpenseResponse,
    isLoading,
    isFetching,
    refetch: refetchTravelExpenseList,
  } = useQuery({
    queryKey: ["travel-expense-list", requestPayload],
    queryFn: () => billingApis.travelExpenseList(requestPayload),
    enabled:
      !!requestPayload.nCompanyId &&
      !!String(requestPayload.cSchemaName ?? "").trim() &&
      !!String(requestPayload.cDbName ?? "").trim(),
  });

  const travelRows = useMemo(
    () => extractRows(travelExpenseResponse?.data ?? travelExpenseResponse ?? {}),
    [travelExpenseResponse],
  );

  const filteredTravelRows = useMemo(() => {
    const selectedDay = selectedDate.startOf("day");

    return travelRows.filter((row) => {
      const rowDateValue =
        getValue(row, ["dCreatedDate", "CreatedDate", "dDate", "Date", "cDate"]) ?? "";
      const parsedDate = parseExpenseDate(rowDateValue);
      return parsedDate ? parsedDate.startOf("day").isSame(selectedDay) : false;
    });
  }, [selectedDate, travelRows]);

  const otherExpenseListPayload = useMemo(() => {
    const request = getRequestPayload();
    return {
      nCompanyId: request.nCompanyId,
      cSchemaName: request.cSchemaName,
      cDbName: request.cDbName,
    };
  }, []);

  const agentDropdownPayload = useMemo(() => getRequestPayload(), []);

  const { refetch: refetchAddExpenseOptions } = useQuery({
    queryKey: ["travel-expense-add-other-expense-list", otherExpenseListPayload],
    queryFn: () => billingApis.otherExpenseList(otherExpenseListPayload),
    enabled: false,
  });

  const {
    data: agentDropdownResponse,
    isLoading: isAgentLoading,
    isFetching: isAgentFetching,
    refetch: refetchAgentDropdown,
  } = useQuery({
    queryKey: ["travel-expense-agent-dropdown", agentDropdownPayload],
    queryFn: () => agentApis.agentDropDown(agentDropdownPayload),
    enabled: agentPickerOpen,
  });

  const agentOptions = useMemo<AgentOption[]>(() => {
    const rows = extractRows(agentDropdownResponse?.data ?? agentDropdownResponse ?? {});
    return rows
      .map((row) => {
        const type = getValue(row, ["nType", "nUserType", "cUserType", "UserType", "userType", "cRole", "Role"]);
        const item = getDropdownValue(
          row,
          ["cAgentName", "AgentName", "agentName", "cUserName", "UserName", "Name"],
          ["nAgentId", "AgentId", "agentId", "id"],
        );

        return {
          ...item,
          role: getAgentSubtitle(row, getRoleLabel(type, false)),
          isSelf: false,
        };
      })
      .filter((item) => item.label);
  }, [agentDropdownResponse]);

  const selfOption: AgentOption = useMemo(
    () => ({
      label: currentUser.name,
      value: String(currentUser.id || ""),
      role: "Self",
      isSelf: true,
    }),
    [currentUser.id, currentUser.name],
  );

  const visibleAgentOptions = useMemo(() => {
    const seen = new Set<string>();
    const baseSelfKey = `${normalize(selfOption.value)}::${normalize(selfOption.label)}`;
    const options = [selfOption, ...agentOptions];

    return options.filter((item) => {
      if (!item.label) return false;

      const key = `${normalize(item.value)}::${normalize(item.label)}`;
      if (seen.has(key)) return false;
      seen.add(key);

      if (key === baseSelfKey) return true;

      const isCurrentUserRow =
        (currentUser.id && String(item.value) === String(currentUser.id)) ||
        (normalize(currentUser.name) && normalize(item.label) === normalize(currentUser.name));

      return !isCurrentUserRow;
    });
  }, [agentOptions, currentUser.id, currentUser.name, selfOption]);

  const filteredAgentOptions = useMemo(() => {
    const query = agentSearch.trim().toLowerCase();
    if (!query) return visibleAgentOptions;

    return visibleAgentOptions.filter((item) =>
      [item.label, item.role ?? "", item.isSelf ? "self" : ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [agentSearch, visibleAgentOptions]);

  useEffect(() => {
    if (!drawerOpen) {
      setSelectedDate(dayjs());
      setSelectedItem(undefined);
      setComment("");
      setAmount("0");
      setAttachments((current) => {
        current.forEach((attachment) => URL.revokeObjectURL(attachment.url));
        return [];
      });
    }
  }, [drawerOpen]);

  useEffect(() => {
    setDraftSelectedDate(selectedDate.toDate());
  }, [selectedDate]);

  useEffect(() => {
    if (!locationState.selectedDate) {
      return;
    }

    const nextDate = dayjs(locationState.selectedDate);
    if (nextDate.isValid()) {
      setSelectedDate(nextDate);
    }
  }, [locationState.selectedDate]);

  useEffect(() => {
    if (locationState.openAddExpense) setDrawerOpen(true);
  }, [locationState.openAddExpense]);

  const defaultDisplayAgent =
    agentOptions.find((item) => String(item.role ?? "").trim().toLowerCase() === "supervisor") ??
    agentOptions[0] ??
    selfOption;
  const selectedDisplayAgent = selectedAgent ?? defaultDisplayAgent;
  const headerAgentLabel = selectedDisplayAgent.label;
  const headerAgentRole = selectedDisplayAgent.isSelf
    ? "Self"
    : selectedDisplayAgent.role || "Agent";
  const headerAgentInitial = (headerAgentLabel.slice(0, 1) || currentUser.shortName || "S").toUpperCase();

  const openDrawer = () => {
    setSelectedDate(dayjs());
    setDrawerOpen(true);
    void Promise.all([
      refetchAddExpenseOptions(),
      refetchAgentDropdown(),
    ]);
  };

  const handleToggleFilter = () => {
    setDraftSelectedDate(selectedDate.toDate());
    setFilterOpen((current) => !current);
  };

  const handleApplyFilter = () => {
    setSelectedDate(dayjs(draftSelectedDate));
    setFilterOpen(false);
  };

  const handleCancelFilter = () => {
    setDraftSelectedDate(selectedDate.toDate());
    setFilterOpen(false);
  };

  const openAgentPicker = () => {
    setAgentSearch("");
    setExpandedAgentId(null);
    setAgentPickerOpen(true);
  };

  const handleAgentSelect = (item: AgentOption) => {
    setSelectedAgent(item);
    setAgentPickerOpen(false);
    setExpandedAgentId(null);
  };

  const handleSave = async () => {
    if (!selectedItem?.trim()) {
      message.warning("Enter an expense item.");
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      message.warning("Enter a valid amount.");
      return;
    }

    const request = getRequestPayload();
    const expenseAgentId = String(
      selectedDisplayAgent.value || request.nAgentId || request.id || currentUser.id || "",
    );
    if (!Number.isFinite(Number(expenseAgentId)) || Number(expenseAgentId) <= 0) {
      message.warning("Unable to identify the selected agent.");
      return;
    }
    const savePayload = {
      cItemName: selectedItem.trim(),
      nFollowupId: 0,
      cComments: comment.trim(),
      cDate: selectedDate.format("YYYY/MM/DD"),
      nAmount: Number(amount),
      nCompanyId: Number(request.nCompanyId),
      nCreatedBy: Number(expenseAgentId),
      cSchemaName: String(request.cSchemaName ?? ""),
      cDbName: String(request.cDbName ?? ""),
    };

    try {
      setIsSaving(true);
      await billingApis.otherExpensesSave(savePayload);
      setLocallySavedExpenses((current) => [
        ...current,
        {
          nExpenseId: 0,
          cItem: selectedItem.trim(),
          cItemName: selectedItem.trim(),
          cComment: comment.trim(),
          cComments: comment.trim(),
          nAmount: Number(amount),
          nBaselineAmount: filteredTravelRows.reduce(
            (sum, row) => sum + getExpenseAmount(row),
            0,
          ),
          cDate: selectedDate.format("YYYY/MM/DD"),
          nAgentId: Number(expenseAgentId) || expenseAgentId,
          cAgentId: expenseAgentId,
          cAgentName: selectedDisplayAgent.label,
        },
      ]);
      await Promise.all([
        refetchTravelExpenseList(),
        billingApis.otherExpenseList({
          nCompanyId: request.nCompanyId,
          cSchemaName: request.cSchemaName,
          cDbName: request.cDbName,
        }),
      ]);
      message.success("Expense saved successfully.");
      setDrawerOpen(false);
    } catch (error: any) {
      const response = error?.response?.data;
      const validationMessage = response?.errors && typeof response.errors === "object"
        ? Object.values(response.errors).flat().find((value) => typeof value === "string")
        : "";
      message.error(
        validationMessage ?? response?.message ?? response?.title ?? "Unable to save expense.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttachmentAdd = (file: File) => {
    const isImage = file.type === "image/jpeg" || file.type === "image/png";
    if (!isImage) {
      message.error("Only JPG or PNG files are allowed.");
      return Upload.LIST_IGNORE;
    }

    setAttachments((current) => [
      ...current,
      {
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        url: URL.createObjectURL(file),
      },
    ]);
    return false;
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const handleRowClick = (row: RecordLike) => {
    const rowDate = parseExpenseDate(
      getValue(row, ["dCreatedDate", "CreatedDate", "dDate", "Date", "cDate"]),
    );
    const rowAgentId = text(
      getValue(row, ["nAgentId", "cAgentId", "AgentId", "agentId"]),
      selectedAgent?.value ?? String(currentUser.id ?? ""),
    );

    navigate("/more/travelingexpense/view", {
      state: {
        selectedDate: (rowDate ?? selectedDate).format("YYYY-MM-DD"),
        selectedAgentId: rowAgentId,
        selectedAgentName: getAgentName(row) || selectedAgent?.label || headerAgentLabel,
        locallySavedExpenses: locallySavedExpenses.filter((expense) => {
          const expenseDate = parseExpenseDate(getValue(expense, ["cDate", "dDate", "Date"]));
          const expenseAgentId = text(getValue(expense, ["nAgentId", "cAgentId"]));
          return (
            expenseDate?.isSame(rowDate ?? selectedDate, "day") &&
            expenseAgentId === rowAgentId
          );
        }),
      },
    });
  };

  const getLocalAmountForRow = (row: RecordLike) => {
    const rowDate = parseExpenseDate(
      getValue(row, ["dCreatedDate", "CreatedDate", "dDate", "Date", "cDate"]),
    );
    const rowAgentId = text(getValue(row, ["nAgentId", "cAgentId", "AgentId", "agentId"]));

    return locallySavedExpenses.reduce((sum, expense) => {
      const expenseDate = parseExpenseDate(getValue(expense, ["cDate", "dDate", "Date"]));
      const expenseAgentId = text(getValue(expense, ["nAgentId", "cAgentId"]));
      const matchesRow =
        rowDate?.isSame(expenseDate, "day") &&
        (!rowAgentId || !expenseAgentId || rowAgentId === expenseAgentId);
      return matchesRow ? sum + number(getValue(expense, ["nAmount", "Amount"]), 0) : sum;
    }, 0);
  };

  useEffect(() => {
    setLocallySavedExpenses((current) => {
      const pending = current.filter((expense) => {
        const expenseDate = parseExpenseDate(getValue(expense, ["cDate", "dDate", "Date"]));
        const expenseAgentId = text(getValue(expense, ["nAgentId", "cAgentId"]));
        const matchingServerAmount = travelRows.reduce((sum, row) => {
          const rowDate = parseExpenseDate(
            getValue(row, ["dCreatedDate", "CreatedDate", "dDate", "Date", "cDate"]),
          );
          const rowAgentId = text(getValue(row, ["nAgentId", "cAgentId", "AgentId", "agentId"]));
          return rowDate?.isSame(expenseDate, "day") && (!rowAgentId || rowAgentId === expenseAgentId)
            ? sum + getExpenseAmount(row)
            : sum;
        }, 0);
        const expectedAmount =
          number(getValue(expense, ["nBaselineAmount"]), 0) +
          number(getValue(expense, ["nAmount"]), 0);
        return matchingServerAmount < expectedAmount;
      });
      return pending.length === current.length ? current : pending;
    });
  }, [travelRows]);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-5">
      <div className="flex flex-none flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-lg font-medium">Traveling Expense</h2>

        <div className="flex items-center gap-3">
          <Button
            type="default"
            onClick={openAgentPicker}
            className="!flex !h-12 !min-w-[240px] !items-center !justify-between !rounded-lg !border-sky-200 !bg-sky-50 !px-3 !py-2 !text-slate-700 !shadow-sm hover:!border-sky-300 hover:!bg-sky-100"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-300 text-sm font-semibold text-slate-800">
                {headerAgentInitial}
              </span>
              <span className="flex flex-col items-start text-left leading-tight">
                <span className="font-medium text-slate-700">{headerAgentLabel}</span>
                <span className="text-xs text-slate-500">{headerAgentRole}</span>
              </span>
            </span>
            <DownOutlined className="text-[10px] text-slate-500" />
          </Button>

          <DateFilterIconPopover
            open={filterOpen}
            iconSrc={year}
            alt="Open calendar"
            ariaLabel="Open travel expense calendar"
            onOpenToggle={handleToggleFilter}
            month={draftSelectedDate}
            selectedDate={draftSelectedDate}
            onMonthChange={setDraftSelectedDate}
            onYearChange={setDraftSelectedDate}
            onSelectDate={(date) => {
              setDraftSelectedDate(date);
              setSelectedDate(dayjs(date));
              setFilterOpen(false);
            }}
            onApply={handleApplyFilter}
            onCancel={handleCancelFilter}
          />

          <Button
            type="primary"
            onClick={openDrawer}
            className="!h-10 !rounded-md !border-emerald-500 !bg-emerald-500 !px-5 !font-medium hover:!border-emerald-600 hover:!bg-emerald-600"
          >
            Add Expense
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
        <Spin spinning={isLoading || isFetching}>
          {filteredTravelRows.length > 0 ? (
            <div className="max-h-[calc(100vh-220px)] overflow-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[60px_minmax(160px,1.4fr)_140px_120px] border-b border-slate-100 px-4 py-4 text-[13px] font-medium text-slate-700">
                  <div>Srl</div>
                  <div>Agent Name</div>
                  <div>Date</div>
                  <div className="text-right">Expense</div>
                </div>

                {filteredTravelRows.map((row, index) => (
                  <div
                    key={`${getAgentName(row)}-${index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowClick(row)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        handleRowClick(row);
                      }
                    }}
                    className="grid cursor-pointer grid-cols-[60px_minmax(160px,1.4fr)_140px_120px] border-b border-slate-50 px-4 py-4 text-[13px] text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <div>{index + 1}</div>
                    <div>{getAgentName(row)}</div>
                    <div>{getTravelDate(row)}</div>
                    <div className="text-right">
                      {`₹${(getExpenseAmount(row) + getLocalAmountForRow(row)).toFixed(2)}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center px-4 py-10">
              <Empty description="No travel expense records found" />
            </div>
          )}
        </Spin>
      </div>

      <Drawer
        title="Add Expense"
        placement="right"
        width={520}
        height="calc(100vh - 150px)"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        styles={{
          header: { minHeight: 64, paddingInline: 20 },
          body: { padding: 20, display: "flex", flexDirection: "column" },
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-2 text-sm text-slate-600">Select Date</div>
              <DatePicker
                className="w-35"
                value={selectedDate}
                onChange={(value) => setSelectedDate(value ?? dayjs())}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined className="text-slate-400" />}
              />
            </div>
          <div>
            <div className="mb-2 text-sm text-slate-600">Item</div>
            <Input
              className="w-full"
              value={selectedItem}
              onChange={(event) => setSelectedItem(event.target.value)}
            />
          </div>
          </div>

          <div>
            <div className="mb-2 text-sm text-slate-600">Comment</div>
            <Input.TextArea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Enter comment"
            />
          </div>

          <div>
            <div className="mb-2 text-sm text-slate-600">Amount</div>
            <Input
              type="text"
              min={0}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          {attachments.length > 0 ? (
            <div className="mt-4 flex items-center gap-2">
              <Button
                type="text"
                aria-label="Previous images"
                className="!px-0 !text-slate-400"
                icon={<LeftOutlined />}
                onClick={() => attachmentStripRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
              />
              <div ref={attachmentStripRef} className="flex min-w-0 flex-1 gap-3 overflow-hidden py-1 scroll-smooth">
                <Image.PreviewGroup>
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative h-[76px] w-[76px] flex-none overflow-visible rounded border border-slate-200 bg-black shadow">
                      <Image
                        src={attachment.url}
                        alt={attachment.file.name}
                        width={74}
                        height={74}
                        className="rounded object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded border border-red-400 bg-white shadow"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeAttachment(attachment.id);
                        }}
                      >
                        <img src={deleteImage} alt="" className="h-4 w-4 rounded bg-red-500 p-[2px]" />
                      </button>
                    </div>
                  ))}
                </Image.PreviewGroup>
              </div>
              <Button
                type="text"
                aria-label="Next images"
                className="!px-0 !text-slate-400"
                icon={<RightOutlined />}
                onClick={() => attachmentStripRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
              />
            </div>
          ) : null}
          </div>

          <div className="mt-auto flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Upload
              accept="image/jpeg,image/png"
              multiple
              showUploadList={false}
              beforeUpload={handleAttachmentAdd}
            >
              <Button type="link" icon={<UploadOutlined />} className="!font-medium">
                Upload Files <span className="ml-1 text-[10px]">(JPG or PNG)</span>
              </Button>
            </Upload>
            <Button
              type="primary"
              loading={isSaving}
              className="!border-emerald-500 !bg-emerald-500"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </Drawer>

      <AgentSelectorModal
        open={agentPickerOpen}
        loading={isAgentLoading || isAgentFetching}
        options={filteredAgentOptions}
        selectedValue={selectedAgent?.value}
        search={agentSearch}
        expandedAgentId={expandedAgentId}
        selfOption={selfOption}
        onSearch={setAgentSearch}
        onSelect={(agent) => handleAgentSelect(agent as AgentOption)}
        onExpandedChange={setExpandedAgentId}
        onClose={() => {
          setAgentPickerOpen(false);
          setExpandedAgentId(null);
        }}
      />
    </section>
  );
};

export default TravelingExpenseModalPage;
