import { useMemo } from "react";
import { Button, Empty, Image, Modal, Spin, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";

import { billingApis } from "../../Axios/BillingApis";
import { getApiImageBaseUrl } from "../../Axios/config";
import { getRequestPayload } from "../../Utils/requestPayload";
import editIcon from "../../assets/icons/Edit-Green.svg";
import deleteIcon from "../../assets/icons/delete-red.svg";
import nodata from "../../assets/images/noDataGif.gif";
import TravelingExpenseDrawer from "./TravelingExpenseDrawer";
type RecordLike = Record<string, any>;

const text = (value: unknown, fallback = "") =>
  String(value ?? "").trim() || fallback;

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

const extractRows = (value: unknown, depth = 0): RecordLike[] => {
  const source = value as RecordLike;
  const candidates = [
    source?.data,
    source?.result,
    source?.items,
    source?.list,
    source?.TravelExpenseList,
    source?.travelExpenseList,
    source?.ExpenseList,
    source?.expenseList,
    source?.OtherExpenseList,
    source?.otherExpenseList,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as RecordLike[];
    if (Array.isArray(candidate?.data)) return candidate.data as RecordLike[];
    if (Array.isArray(candidate?.items)) return candidate.items as RecordLike[];
    if (
      candidate &&
      typeof candidate === "object" &&
      getValue(candidate, ["cItem", "cExpenseName", "cOtherExpenseName", "nAmount", "nOtherExpenseAmount"])
    ) {
      return [candidate as RecordLike];
    }
  }

  if (Array.isArray(value)) return value as RecordLike[];

  if (source && typeof source === "object" && depth < 4) {
    for (const nested of Object.values(source)) {
      if (!nested || typeof nested !== "object") continue;
      const nestedRows = extractRows(nested, depth + 1);
      if (nestedRows.length) return nestedRows;
    }
  }

  return [];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const getAmount = (row: RecordLike) =>
  number(getValue(row, ["nOtherExpenseAmount", "nAmount", "Amount", "amount"]), 0);

const getName = (row: RecordLike) =>
  text(
    getValue(row, ["cItem", "cItemName", "cOtherExpenseName", "OtherExpenseName", "cExpenseName", "ExpenseName", "Name"]),
    "Expense",
  );

const getRemarks = (row: RecordLike) =>
  text(getValue(row, ["cRemarks", "Remarks", "Comment", "cComment", "cComments", "Description"]), "");

const getExpenseId = (row: RecordLike) =>
  number(getValue(row, ["nExpenseId", "ExpenseId", "expenseId", "id"]), 0);

const resolveImageUrl = (value: unknown) => {
  const path = text(value);
  if (!path || /^(https?:|data:|blob:)/i.test(path)) return path;
  try {
    return `${getApiImageBaseUrl().replace(/\/+$/, "")}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
  } catch {
    return path.replace(/\\/g, "/");
  }
};

const getAttachments = (row: RecordLike) => {
  let source = getValue(row, ["attachments", "Attachments", "attachmentList", "AttachmentList"]);
  if (!source) {
    source = getValue(row, [
      "cUrl", "url", "cFileUrl", "FileUrl", "cFilePath", "FilePath",
      "cAttachmentPath", "AttachmentPath", "cPath", "path",
    ]);
  }
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = source.trim() ? [source] : [];
    }
  }

  const values = Array.isArray(source) ? source : source ? [source] : [];
  return values
    .map((attachment) => {
      if (typeof attachment === "string") return resolveImageUrl(attachment);
      return resolveImageUrl(
        getValue(attachment, [
          "cUrl", "url", "cFileUrl", "FileUrl", "cFilePath", "FilePath",
          "cAttachmentPath", "AttachmentPath", "cPath", "path",
        ]),
      );
    })
    .filter(Boolean);
};

const TravelingExpenseViewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecordLike | null>(null);
  const locationState = (location.state ?? {}) as Record<string, any>;
  const [locallySavedExpenses, setLocallySavedExpenses] = useState<RecordLike[]>(() =>
    Array.isArray(locationState.locallySavedExpenses)
      ? locationState.locallySavedExpenses
      : [],
  );

  const selectedDate = locationState.selectedDate
    ? dayjs(locationState.selectedDate)
    : dayjs();

  const companyPayload = useMemo(
    () => {
      const payload = getRequestPayload();

      return {
        nCompanyId: payload.nCompanyId,
        cSchemaName: payload.cSchemaName,
        cDbName: payload.cDbName,
      };
    },
    [],
  );

  const travelExpensePayload = useMemo(() => {
    const payload = getRequestPayload();

    return {
      cAgentId: String(
        locationState.selectedAgentId ?? payload.nAgentId ?? payload.id ?? "",
      ),
      dDate: selectedDate.format("YYYY/MM/DD"),
      nCompanyId: payload.nCompanyId,
      cSchemaName: payload.cSchemaName,
      cDbName: payload.cDbName,
    };
  }, [locationState.selectedAgentId, selectedDate]);

  const companyRequestEnabled =
    !!companyPayload.nCompanyId &&
    !!String(companyPayload.cSchemaName ?? "").trim() &&
    !!String(companyPayload.cDbName ?? "").trim();

  const {
    data: travelExpenseData,
    isLoading: isTravelExpenseLoading,
    isFetching: isTravelExpenseFetching,
    refetch: refetchTravelExpense,
  } = useQuery({
    queryKey: ["travel-expense-view", travelExpensePayload],
    queryFn: () => billingApis.travelExpense(travelExpensePayload),
    enabled:
      companyRequestEnabled &&
      !!travelExpensePayload.cAgentId &&
      selectedDate.isValid(),
  });

  const { refetch: refetchOtherExpenseList } = useQuery({
    queryKey: ["travel-expense-other-list", companyPayload],
    queryFn: () => billingApis.otherExpenseList(companyPayload),
    enabled:
      companyRequestEnabled,
  });

  const travelExpenseRows = useMemo(
    () => extractRows(travelExpenseData?.data ?? travelExpenseData ?? {}),
    [travelExpenseData],
  );
  const expenseRows = useMemo(() => [], []);
  const otherExpenseRows = useMemo(() => {
    const pendingRows = locallySavedExpenses.filter((pending) =>
      !travelExpenseRows.some((saved) =>
        getName(saved).toLowerCase() === getName(pending).toLowerCase() &&
        getRemarks(saved).toLowerCase() === getRemarks(pending).toLowerCase() &&
        getAmount(saved) === getAmount(pending),
      ),
    );
    return [...travelExpenseRows, ...pendingRows];
  }, [locallySavedExpenses, travelExpenseRows]);

  const totalExpense = useMemo(
    () =>
      [...expenseRows, ...otherExpenseRows].reduce(
        (sum, row) => sum + getAmount(row),
        0,
      ),
    [expenseRows, otherExpenseRows],
  );

  const handleDeleteExpense = (row: RecordLike) => {
    const expenseId = getExpenseId(row);
    if (!expenseId) {
      message.error("Unable to identify this expense.");
      return;
    }

    Modal.confirm({
      title: "Delete Expense",
      content: `Are you sure you want to delete ${getName(row)}?`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      async onOk() {
        await billingApis.otherExpensesDelete({
          nExpenseId: expenseId,
          nCompanyId: Number(companyPayload.nCompanyId),
          nCreatedBy: Number(travelExpensePayload.cAgentId),
          cSchemaName: companyPayload.cSchemaName,
          cDbName: companyPayload.cDbName,
        });
        setLocallySavedExpenses((current) =>
          current.filter((expense) => getExpenseId(expense) !== expenseId),
        );
        await Promise.all([refetchTravelExpense(), refetchOtherExpenseList()]);
        message.success("Expense deleted successfully.");
      },
    });
  };

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-[18px] font-medium text-slate-900">Traveling Expense</div>
        <div className="flex items-center gap-3">
          <div className="text-[16px] text-slate-900">
            ({locationState.selectedAgentName ?? "Testing Team"}) {selectedDate.format("DD/MM/YYYY")}
          </div>
          <Button
            type="text"
            aria-label="Close"
            onClick={() => navigate(-1)}
            className="!h-8 !w-8 !rounded-full !p-0"
            icon={<CloseOutlined className="text-base text-slate-900" />}
          />
        </div>
      </div>

      <div className="border-b border-slate-100 bg-[#d8e4ed] px-4 py-3">
        <span className="text-[16px] text-slate-900">Total Expense</span>
        <span className="ml-4 text-[16px] font-medium text-[#e6b800]">
          {formatCurrency(totalExpense)}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 bg-[#d8e4ed] lg:grid-cols-2">
        <div className="border-r border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <div className="text-[15px] font-medium text-slate-900">Expense</div>
            <div className="text-[15px] text-blue-600">
              {formatCurrency(expenseRows.reduce((sum, row) => sum + getAmount(row), 0))}
            </div>
          </div>

          <Spin spinning={isTravelExpenseLoading || isTravelExpenseFetching}>
            <div className="min-h-[calc(100vh-230px)] px-4 py-3">
              {expenseRows.length > 0 ? (
                <div className="space-y-3">
                  {expenseRows.map((row, index) => (
                    <div key={`expense-${index}`} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-medium text-slate-800">{getName(row)}</div>
                          <div className="text-[12px] text-slate-600">
                            {getRemarks(row) || `(${getName(row)})`}
                          </div>
                        </div>
                        <div className="text-[14px] text-slate-900">
                          {formatCurrency(getAmount(row))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center">
                 <img src={nodata} alt="No Data" className="h-60 w-60" />
                </div>
              )}
            </div>
          </Spin>
        </div>

        <div className="relative bg-[#d8e4ed]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 ">
            <div className="text-[15px] font-medium text-slate-900 ">Other Expense</div>
            <div className="text-[15px] text-blue-600 ">
              {formatCurrency(otherExpenseRows.reduce((sum, row) => sum + getAmount(row), 0))}
            </div>
          </div>

          <Spin spinning={isTravelExpenseLoading || isTravelExpenseFetching}>
            <div className="min-h-[calc(100vh-230px)]  px-4 py-3">
              {otherExpenseRows.length > 0 ? (
                <div className="space-y-2 overflow-y-auto h-110 decoration-0 scrollbar-thin scrollbar-thumb-blue-300  scrollbar-track-slate-200">
                  {otherExpenseRows.map((row, index) => {
                    const rowAttachments = getAttachments(row);
                    return (
                    <div key={`other-${index}`} className="rounded border border-sky-200 bg-white px-4 py-3 ">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-medium text-slate-800">{getName(row)}</div>
                          <div className="text-[12px] text-slate-600">
                            {getRemarks(row) || `(${getName(row)})`}
                          </div>
                        </div>
                        <div className="text-[14px] text-slate-900">
                          {formatCurrency(getAmount(row))}
                        </div>
                      </div>
                      {rowAttachments.length > 0 ? (
                        <Image.PreviewGroup>
                          <div className="mt-3 inline-block gap-2 rounded border border-sky-700 w-26 px-1 pt-1">
                            {rowAttachments.map((url, attachmentIndex) => (
                              <Image
                                key={`${url}-${attachmentIndex}`}
                                src={url}
                                alt={`${getName(row)} attachment`}
                                width={82}
                                height={82}
                                className=" rounded  object-cover"
                              />
                            ))}
                          </div>
                        </Image.PreviewGroup>
                      ) : null}
                      <div className={`mt-2 flex gap-3 ${rowAttachments.length > 0 ? "justify-end" : "justify-start"}`}>
                        <button
                          type="button"
                          aria-label={`Edit ${getName(row)}`}
                          className="h-4 w-4"
                          onClick={() => {
                            setEditingExpense(row);
                            setAddExpenseOpen(true);
                          }}
                        >
                          <img src={editIcon} alt="" className="h-full w-full" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${getName(row)}`}
                          className="h-4 w-4"
                          onClick={() => handleDeleteExpense(row)}
                        >
                          <img src={deleteIcon} alt="" className="h-full w-full" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[360px] items-center justify-center">
                  <Empty description="No Data!" />
                </div>
              )}
            </div>
          </Spin>
          <div className="absolute bottom-2 right-6">
            <Button
              type="primary"
              className="!border-emerald-500 !bg-emerald-500 !px-5"
              onClick={() => {
                setEditingExpense(null);
                setAddExpenseOpen(true);
              }}
            >
              Add Expense
            </Button>
          </div>
        </div>
      </div>

      <TravelingExpenseDrawer
        open={addExpenseOpen}
        initialDate={selectedDate}
        agentId={travelExpensePayload.cAgentId}
        expense={editingExpense}
        onClose={() => {
          setAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSaved={async (expense) => {
          const savedExpenseId = getExpenseId(expense);
          setLocallySavedExpenses((current) => savedExpenseId
            ? [...current.filter((item) => getExpenseId(item) !== savedExpenseId), expense]
            : [...current, expense]);
          await Promise.all([
            refetchTravelExpense(),
            refetchOtherExpenseList(),
          ]);
        }}
      />
    </section>
  );
};

export default TravelingExpenseViewPage;
