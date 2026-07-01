import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Tag, message } from "antd";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";

import { billingApis } from "../../Axios/BillingApis";
import { getRequestPayload } from "../../Utils/requestPayload";

type BillShareModalProps = {
  open: boolean;
  onClose: () => void;
  companyPayload: Record<string, any>;
  billContext: Record<string, any>;
};

const normalizeSingleRecord = (value: any) => {
  if (Array.isArray(value)) return value[0] ?? {};
  if (value && typeof value === "object") return value;
  return {};
};

const resolveConfigurationRecord = (value: any) => {
  const root = normalizeSingleRecord(value);
  const candidates = [
    root?.data,
    root?.result,
    root?.configuration,
    root?.companyDetails,
    root?.CompanyDetails,
    root?.Data,
    root?.Result,
  ];
  const targetKeys = new Set([
    "ccompanyname",
    "ccomapnyname",
    "companyname",
    "caddress",
    "address",
    "ccompanyaddress",
    "companyaddress",
    "cemail",
    "email",
    "ccompanyemail",
    "cmail",
    "cphoneno",
    "cphonenumber",
    "phonenumber",
    "phone",
    "phoneno",
    "cmobile",
    "cmobileno",
    "mobileno",
    "ccontactno",
    "contactno",
    "clogourl",
    "logourl",
    "ccompanylogourl",
    "clogopath",
    "logopath",
    "clogo",
    "ccompanylogo",
    "ccompanylogoimage",
  ]);

  const deepFind = (input: any, seen = new Set<any>()): Record<string, any> => {
    if (!input || typeof input !== "object" || seen.has(input)) return {};
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        const match = deepFind(item, seen);
        if (Object.keys(match).length > 0) return match;
      }
      return {};
    }

    const keys = Object.keys(input);
    const hasTarget = keys.some((key) => targetKeys.has(key.toLowerCase()));
    if (hasTarget) {
      return input as Record<string, any>;
    }

    for (const key of keys) {
      const match = deepFind((input as any)[key], seen);
      if (Object.keys(match).length > 0) return match;
    }

    return {};
  };

  const hasTargetKeys = (record: Record<string, any>) =>
    Object.keys(record ?? {}).some((key) => targetKeys.has(key.toLowerCase()));

  for (const candidate of candidates) {
    const resolved = normalizeSingleRecord(candidate);
    if (Object.keys(resolved).length > 0 && hasTargetKeys(resolved)) {
      return resolved;
    }

    const deepResolved = deepFind(candidate);
    if (Object.keys(deepResolved).length > 0) {
      return deepResolved;
    }
  }

  const deepRoot = deepFind(root);
  if (Object.keys(deepRoot).length > 0) return deepRoot;

  return root;
};

const scoreBillRecord = (record: Record<string, any>) => {
  if (!record || typeof record !== "object") return -1;

  const keys = Object.keys(record).map((key) => key.toLowerCase());
  const has = (names: string[]) => keys.some((key) => names.includes(key));

  let score = 0;
  if (has(["nbillid", "billid"])) score += 100;
  if (has(["nbillno", "billno", "cbillno"])) score += 25;
  if (has(["dbilldate", "billdate"])) score += 10;
  if (has(["itemdtls", "itemdetails", "partdetails", "rows"])) score += 12;
  if (has(["paydtls", "paymentdetails", "paymentdtls"])) score += 8;
  if (has(["totals", "total", "billsummary"])) score += 6;
  if (has(["ccustomername", "customername"])) score += 4;
  if (has(["ccompanyname", "companyname", "ccomapnyname"])) score += 4;

  const numericId = Number(record.nBillId ?? record.BillId ?? record.billId ?? 0);
  if (Number.isFinite(numericId) && numericId > 0) {
    score += Math.min(numericId / 1000, 1);
  }

  return score;
};

const findBestBillRecord = (value: any) => {
  const seen = new Set<any>();
  let bestRecord: Record<string, any> = {};
  let bestScore = -1;
  let bestId = -1;

  const visit = (input: any) => {
    if (!input || typeof input !== "object" || seen.has(input)) return;
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        visit(item);
      }
      return;
    }

    const record = input as Record<string, any>;
    const score = scoreBillRecord(record);
    const numericId = Number(record.nBillId ?? record.BillId ?? record.billId ?? 0) || 0;

    if (
      score > bestScore ||
      (score === bestScore && numericId > bestId) ||
      (score === bestScore && numericId === bestId && Object.keys(record).length > Object.keys(bestRecord).length)
    ) {
      bestScore = score;
      bestId = numericId;
      bestRecord = record;
    }

    for (const child of Object.values(record)) {
      if (child && typeof child === "object") {
        visit(child);
      }
    }
  };

  visit(value);
  return bestRecord;
};

const collectBillIds = (value: any) => {
  const seen = new Set<any>();
  const ids: number[] = [];

  const visit = (input: any) => {
    if (!input || typeof input !== "object" || seen.has(input)) return;
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        visit(item);
      }
      return;
    }

    const numericId = Number(input.nBillId ?? input.BillId ?? input.billId ?? 0);
    if (Number.isFinite(numericId) && numericId > 0) {
      ids.push(numericId);
    }

    for (const child of Object.values(input)) {
      if (child && typeof child === "object") {
        visit(child);
      }
    }
  };

  visit(value);
  return ids;
};

const resolveBillId = (billContext: Record<string, any>) => {
  const candidates = [
    billContext?.rawBillViewData,
    billContext?.rawViewData,
    billContext?.rawFallbackState,
    billContext?.billSummary,
    billContext?.ticketSummary,
    billContext,
  ];

  const foundIds: number[] = [];

  const collectIds = (input: any, seen = new Set<any>()) => {
    if (!input || typeof input !== "object" || seen.has(input)) return;
    seen.add(input);

    if (Array.isArray(input)) {
      for (const item of input) {
        collectIds(item, seen);
      }
      return;
    }

    const numericId = Number(input.nBillId ?? input.BillId ?? input.billId ?? 0);
    if (Number.isFinite(numericId) && numericId > 0) {
      foundIds.push(numericId);
    }

    for (const child of Object.values(input)) {
      if (child && typeof child === "object") {
        collectIds(child, seen);
      }
    }
  };

  candidates.forEach((candidate) => collectIds(candidate));

  const maxFoundId = foundIds.length > 0 ? Math.max(...foundIds) : 0;
  const rawMaxId = Math.max(
    0,
    ...collectBillIds(billContext?.rawBillViewData),
    ...collectBillIds(billContext?.rawViewData),
    ...collectBillIds(billContext?.rawFallbackState),
    ...collectBillIds(billContext?.billSummary),
    ...collectBillIds(billContext?.ticketSummary),
    ...collectBillIds(billContext),
  );

  for (const candidate of candidates) {
    const bestRecord = findBestBillRecord(candidate);
    const resolved = Number(
      bestRecord.nBillId ??
        bestRecord.BillId ??
        bestRecord.billId ??
        candidate?.nBillId ??
        candidate?.BillId ??
        candidate?.billId ??
        0,
    );

    if (Number.isFinite(resolved) && resolved > 0) {
      return Math.max(resolved, maxFoundId, rawMaxId);
    }
  }

  return Math.max(maxFoundId, rawMaxId);
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getPdfUrlFromResponse = (response: any) => {
  if (typeof response === "string" && response.trim()) {
    return response.trim();
  }

  const responseData = response?.data?.data ?? response?.data ?? response ?? {};
  const candidates = [
    responseData?.pdfPath,
    responseData?.cPdfPath,
    responseData?.filePath,
    responseData?.path,
    responseData?.cFileUrl,
    responseData?.fileUrl,
    responseData?.pdfUri,
    responseData?.pdfUrl,
    responseData?.cPdfUrl,
    responseData?.url,
    responseData?.result?.pdfPath,
    responseData?.result?.cPdfPath,
    responseData?.result?.filePath,
    responseData?.result?.path,
    responseData?.result?.cFileUrl,
    responseData?.result?.fileUrl,
    responseData?.result?.pdfUri,
    responseData?.result?.pdfUrl,
    responseData?.result?.cPdfUrl,
    responseData?.result?.url,
    responseData?.data?.pdfPath,
    responseData?.data?.cPdfPath,
    responseData?.data?.filePath,
    responseData?.data?.path,
    responseData?.data?.cFileUrl,
    responseData?.cFileUrl,
    responseData?.data?.fileUrl,
    responseData?.fileUrl,
    responseData?.data?.pdfUri,
    responseData?.pdfUri,
    responseData?.data?.pdfUrl,
    responseData?.data?.cPdfUrl,
    responseData?.data?.url,
    responseData?.data?.fileUrl,
    responseData?.data?.path,
    responseData?.pdfPath,
    responseData?.cPdfPath,
    responseData?.filePath,
    responseData?.path,
    responseData?.pdfUrl,
    responseData?.cPdfUrl,
    responseData?.url,
    responseData?.fileUrl,
    responseData?.path,
  ];

  const match = candidates.find(
    (value) => typeof value === "string" && value.trim(),
  );

  if (typeof match === "string") return match.trim();

  const seen = new Set<any>();
  const stack: any[] = [responseData];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || typeof current !== "object" || seen.has(current)) {
      continue;
    }

    seen.add(current);

    for (const [key, value] of Object.entries(current)) {
      if (typeof value === "string") {
        const lowerKey = key.toLowerCase();
        const lowerValue = value.trim().toLowerCase();
        if (
          (lowerKey.includes("pdf") ||
            lowerKey.includes("url") ||
            lowerKey.includes("path") ||
            lowerKey.includes("file")) &&
          lowerValue
        ) {
          return value.trim();
        }

        if (lowerValue.includes(".pdf")) {
          return value.trim();
        }
      } else if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }

  return "";
};

const BillShareModal: React.FC<BillShareModalProps> = ({
  open,
  onClose,
  companyPayload,
  billContext,
}) => {
  const sessionPayload = useMemo(() => getRequestPayload(), []);
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setEmail("");
    setEmails([]);
    setIsSubmitting(false);
  }, [open]);

  const addEmail = () => {
    const nextEmail = normalizeEmail(email);

    if (!nextEmail) return;

    if (!isValidEmail(nextEmail)) {
      message.error("Please enter a valid email address");
      return;
    }

    setEmails((prev) => (prev.includes(nextEmail) ? prev : [...prev, nextEmail]));
    setEmail("");
  };

  const handleOk = async () => {
    const finalEmails = [...emails];
    const inlineEmail = normalizeEmail(email);

    if (inlineEmail) {
      if (!isValidEmail(inlineEmail)) {
        message.error("Please enter a valid email address");
        return;
      }

      if (!finalEmails.includes(inlineEmail)) {
        finalEmails.push(inlineEmail);
      }
    }

    if (finalEmails.length === 0) {
      message.error("Please add at least one email address");
      return;
    }

    const companyId = Number(
      companyPayload?.nCompanyId ??
        billContext?.companyDetails?.nCompanyId ??
        billContext?.companyDetails?.companyId ??
        billContext?.sessionPayload?.nCompanyId ??
        billContext?.sessionPayload?.companyDetails?.nCompanyId ??
        billContext?.nCompanyId ??
        billContext?.companyId ??
        sessionPayload?.nCompanyId ??
        0,
    ) || 0;
    const schemaName =
      companyPayload?.cSchemaName ??
      billContext?.companyDetails?.cSchemaName ??
      billContext?.sessionPayload?.cSchemaName ??
      billContext?.sessionPayload?.companyDetails?.cSchemaName ??
      billContext?.cSchemaName ??
      sessionPayload?.cSchemaName ??
      "";
    const dbName =
      companyPayload?.cDbName ??
      billContext?.companyDetails?.cDbName ??
      billContext?.sessionPayload?.cDbName ??
      billContext?.sessionPayload?.companyDetails?.cDbName ??
      billContext?.cDbName ??
      sessionPayload?.cDbName ??
      "";

    if (!companyId || !schemaName || !dbName) {
      message.error("Bill configuration is missing");
      return;
    }

    const billId = resolveBillId(billContext);
    if (!billId) {
      message.error("Unable to determine bill number");
      return;
    }

    setIsSubmitting(true);

    try {
      const configResponse = await billingApis.getConfiguration({
        ...sessionPayload,
        ...companyPayload,
      });
      const configuration = resolveConfigurationRecord(
        configResponse?.data?.data ?? configResponse?.data ?? configResponse ?? {},
      );

      const exportPayload = {
        ...sessionPayload,
        ...companyPayload,
        ...billContext,
        nCompanyId: companyId,
        cSchemaName: schemaName,
        cDbName: dbName,
        nBillId: billId,
        BillId: billId,
        billId,
        cCompanyName:
          billContext?.companyName ??
          configuration?.cCompanyName ??
          configuration?.companyName ??
          "",
        cAddress:
          billContext?.companyAddress ??
          configuration?.cAddress ??
          configuration?.address ??
          "",
        cEmail:
          billContext?.companyEmail ??
          configuration?.cEmail ??
          configuration?.email ??
          "",
        cPhoneNo:
          billContext?.companyPhone ??
          configuration?.cPhoneNo ??
          configuration?.phoneNo ??
          "",

          
        nBillNo: billContext?.billNo ?? billContext?.nBillNo ?? "",
        cBillNo: billContext?.billNo ?? billContext?.nBillNo ?? "",
        customerName: billContext?.customerName ?? "",
        cCustomerName: billContext?.customerName ?? "",
        billSummary: billContext?.billSummary ?? {},
        ticketSummary: billContext?.ticketSummary ?? {},
        itemDtls: billContext?.rows ?? [],
        payDtls: billContext?.payDtls ?? [],
        totals: billContext?.totals ?? {},
      };

      const exportResponse = await billingApis.billExportPdf(exportPayload);
      const pdfUrl = getPdfUrlFromResponse(exportResponse);

      if (!pdfUrl) {
        console.error("BillExportPdf response did not include a PDF url", exportResponse);
        message.error("Unable to generate bill PDF link");
        return;
      }

      await billingApis.sendBillMail({
        ...sessionPayload,
        ...companyPayload,
        ...billContext,
        nCompanyId: companyId,
        cSchemaName: schemaName,
        cDbName: dbName,
        nBillId: billId,
        BillId: billId,
        billId,
        Subject: `Bill PDF - Bill No : ${billContext?.billNo ?? ""}`,
        ToEmail: finalEmails.join(","),
        AttachmentUrl: pdfUrl,
        cMailType: "detailed",
        MailType: "detailed",
        cType: "bill",
        Type: "bill",
        cSendType: "bill",
        SendType: "bill",
        cInfoType: "Bill Information",
        InfoType: "Bill Information",
        cBillNo: billContext?.billNo ?? "",
        nBillNo: billContext?.billNo ?? "",
      });

      message.success("Bill sent successfully");
      onClose();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to send bill email",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      destroyOnClose
      title={null}
      zIndex={1400}
      closeIcon={<CloseOutlined className="text-xl text-black" />}
      styles={{
        body: {
          padding: "14px 16px 16px",
        },
      }}
    >
      <div className="space-y-4">
        <div className="text-[18px] font-medium text-slate-900">
          Share Bill to Customer
        </div>

        <div className="h-px w-full bg-slate-200" />

        <div className="space-y-3">
          <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-slate-700">
            Bill No: <span className="font-semibold">{billContext?.billNo || "-"}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {emails.map((item) => (
              <Tag
                key={item}
                closable
                onClose={() =>
                  setEmails((prev) => prev.filter((value) => value !== item))
                }
                className="m-0 rounded-full px-3 py-1 text-sm"
              >
                {item}
              </Tag>
            ))}
          </div>

          <div className="space-y-1">
            <div className="text-sm text-slate-600">Email Address</div>
            <div className="flex items-center gap-2">
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onPressEnter={addEmail}
                placeholder="Enter email address"
                className="flex-1"
                suffix={email ? <CloseOutlined onClick={() => setEmail("")} /> : null}
              />
              <Button
                type="primary"
                onClick={addEmail}
                className="!h-9 !w-9 !min-w-9 !px-0 !bg-black !border-black"
                icon={<PlusOutlined />}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            loading={isSubmitting}
            onClick={handleOk}
            className="!bg-black !border-black hover:!bg-slate-800 hover:!border-slate-800"
          >
            Ok
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BillShareModal;
