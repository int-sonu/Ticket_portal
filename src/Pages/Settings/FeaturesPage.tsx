/* eslint-disable @typescript-eslint/no-explicit-any -- API responses vary between deployed tenant versions. */
import { useEffect, useMemo, useState } from "react";
import { Alert, Input, Select, Spin, Switch, message } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { settingsApis } from "../../Axios/SettingsApi";
import { getRequestPayload } from "../../Utils/requestPayload";
import { extractList, getApiMessage, toBooleanValue } from "../Master/Common/SimpleMasterUtils";
import MasterDateField from "../Master/Common/MasterDateField";

type FeatureKey =
  | "asset"
  | "email"
  | "billReset"
  | "ticketReset"
  | "billing"
  | "repairAndReplace"
  | "closedTicketVerification"
  | "multipleProgress"
  | "callReportSign"
  | "locationOnCallReport"
  | "otpVerification"
  | "ticketAcknowledgment"
  | "itemRepairVerification"
  | "verificationRequired"
  | "partReturnToAgent";

type FeatureState = Record<FeatureKey, boolean> & {
  billResetDate: Dayjs | null;
  ticketResetDate: Dayjs | null;
  currencyId: string;
  decimalPoint: string;
};

const initialState: FeatureState = {
  asset: false,
  email: false,
  billReset: false,
  ticketReset: false,
  billing: false,
  repairAndReplace: false,
  closedTicketVerification: false,
  multipleProgress: false,
  callReportSign: false,
  locationOnCallReport: false,
  otpVerification: false,
  ticketAcknowledgment: false,
  itemRepairVerification: false,
  verificationRequired: false,
  partReturnToAgent: false,
  billResetDate: null,
  ticketResetDate: null,
  currencyId: "",
  decimalPoint: "#0.00",
};

const aliases: Record<keyof FeatureState, string[]> = {
  asset: ["bEnableAsset", "bShowAsset", "bAsset", "bAssetManagement", "asset"],
  email: ["bEmailMadatory", "bEmailMandatory", "bEmail", "bEmailManagement", "email"],
  billReset: ["bEnableBillNoReset", "bBillNoReset", "bBillReset", "billReset"],
  ticketReset: ["bEnableTicketNoReset", "bTicketNoReset", "bTicketReset", "ticketReset"],
  billing: ["bEnableBilling", "bBilling", "billing"],
  repairAndReplace: ["bCallReportAddItem", "bCallReportPartTakenForRepairAndReplace", "bPartTakenForRepairAndReplace", "bRepairAndReplace"],
  closedTicketVerification: ["bReviewTicket", "bClosedTicketVerification", "closedTicketVerification"],
  multipleProgress: ["bAllowMultipleProgress", "bMultipleProgress", "multipleProgress"],
  callReportSign: ["bCallReportSign", "callReportSign"],
  locationOnCallReport: ["bLocationOnCallreport", "bLocationOnCallReport", "locationOnCallReport"],
  otpVerification: ["bOtpVerification", "bOTPVerification", "otpVerification"],
  ticketAcknowledgment: ["bGenerateTicketAcknowledgment", "bAcknowledgment", "bTicketAcknowledgment", "ticketAcknowledgment"],
  itemRepairVerification: ["bItemRepairVerify", "bItemRepairVerification", "itemRepairVerification"],
  verificationRequired: ["bExternalRepairVerify", "bVerificationRequired", "verificationRequired"],
  partReturnToAgent: ["bItemReturnToAgent", "bPartReturnToAgent", "partReturnToAgent"],
  billResetDate: ["dBillResetDate", "cBillResetDate", "dBillNoResetFrom", "dBillResetFrom", "billResetDate"],
  ticketResetDate: ["dResetDate", "cResetDate", "dTicketNoResetFrom", "dTicketResetFrom", "ticketResetDate"],
  currencyId: ["nCurrencyId", "nCurrencyid", "currencyId"],
  decimalPoint: ["cDecimalPoints", "cDecimalPoint", "cDecimalFormat", "decimalPoint"],
};

const findValue = (record: Record<string, any>, names: string[]) => {
  const key = Object.keys(record).find((item) =>
    names.some((name) => name.toLowerCase() === item.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const unwrapRecord = (response: any): Record<string, any> => {
  const candidates = [response?.data?.data, response?.data?.message, response?.message, response?.result, response?.features, response?.data, response];
  const value = candidates.find((item) => item && (Array.isArray(item) || typeof item === "object"));
  if (Array.isArray(value)) {
    if (value.length === 1 && typeof value[0] === "object") return value[0];
    return value.reduce((result, item) => {
      const name = item?.cFeatureName ?? item?.featureName ?? item?.name ?? item?.cName;
      const featureValue = item?.bEnabled ?? item?.bActive ?? item?.value ?? item?.featureValue;
      if (name) result[String(name).replace(/[^a-z0-9]/gi, "")] = featureValue;
      return result;
    }, {} as Record<string, any>);
  }
  return value && typeof value === "object" ? value : {};
};

const parseDate = (value: unknown) => {
  if (!value) return null;
  const parsed = dayjs(value as string);
  return parsed.isValid() ? parsed : null;
};

const mapFeatureState = (record: Record<string, any>): FeatureState => {
  const next = { ...initialState };
  (Object.keys(initialState) as Array<keyof FeatureState>).forEach((key) => {
    const value = findValue(record, aliases[key]);
    if (value === undefined || value === null) return;
    if (key === "billResetDate" || key === "ticketResetDate") next[key] = parseDate(value);
    else if (key === "currencyId" || key === "decimalPoint") next[key] = String(value);
    else next[key] = toBooleanValue(value) as never;
  });
  return next;
};

const getCurrencyOptions = (response: any) =>
  extractList(response).map((item: any, index) => ({
    value: String(item?.nCurrencyId ?? item?.nCurrencyid ?? item?.id ?? item?.value ?? index),
    label: String(item?.cCurrencyName ?? item?.cCurrName ?? item?.name ?? item?.label ?? "Currency"),
  }));

const FeatureRow = ({ title, description, checked, onChange, disabled = false }: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-start justify-between gap-6 border-b border-slate-200 py-5">
    <div className="min-w-0">
      <h2 className="m-0 text-[16px] font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-[13px] leading-5 text-slate-600">{description}</p>
    </div>
    <Switch className="mt-1 shrink-0" checked={checked} disabled={disabled} onChange={onChange} />
  </div>
);

const FeaturesPage = () => {
  const requestPayload = useMemo(() => getRequestPayload(), []);
  const [features, setFeatures] = useState(initialState);
  const [rawFeatures, setRawFeatures] = useState<Record<string, any>>({});
  const [currencies, setCurrencies] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError("");
      const [featureResult, currencyResult] = await Promise.allSettled([
        settingsApis.getCompanyFeatures(requestPayload),
        settingsApis.currencyDropDown(requestPayload),
        settingsApis.itemRepairListCount(requestPayload),
      ]).then((results) => [results[0], results[1]]);
      if (!active) return;
      if (featureResult.status === "fulfilled") {
        const record = unwrapRecord(featureResult.value);
        setRawFeatures(record);
        setFeatures(mapFeatureState(record));
      } else {
        setLoadError(getApiMessage(featureResult.reason, "Unable to load company features."));
      }
      if (currencyResult.status === "fulfilled") setCurrencies(getCurrencyOptions(currencyResult.value));
      setIsLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [requestPayload]);

  const buildSavePayload = (next: FeatureState) => {
    const currencyId = Number(next.currencyId);
    return {
      nFeatureId: Number(
        findValue(rawFeatures, ["nFeatureId", "nFeatureid", "featureId", "id"]) ?? 0,
      ),
      bShowAsset: next.asset,
      bCallReportAddItem: next.repairAndReplace,
      bEnableAsset: next.asset,
      bEnableBilling: next.billing,
      bEmailMadatory: next.email,
      bEnableTicketNoReset: next.ticketReset,
      bEnableBillNoReset: next.billReset,
      dResetDate: next.ticketResetDate?.format("YYYY-MM-DD") ?? null,
      dBillResetDate: next.billResetDate?.format("YYYY-MM-DD") ?? null,
      bReviewTicket: next.closedTicketVerification,
      bCallReportSign: next.callReportSign,
      bAllowMultipleProgress: next.multipleProgress,
      bLocationOnCallreport: next.locationOnCallReport,
      bOtpVerification: next.otpVerification,
      bGenerateTicketAcknowledgment: next.ticketAcknowledgment,
      bItemRepairVerify: next.itemRepairVerification,
      bExternalRepairVerify: next.verificationRequired,
      bItemReturnToAgent: next.partReturnToAgent,
      bOtpOnWebSupportTicket: toBooleanValue(findValue(rawFeatures, ["bOtpOnWebSupportTicket"]), false),
      bEnableBillOnlyClosed: toBooleanValue(findValue(rawFeatures, ["bEnableBillOnlyClosed"]), false),
      cDecimalPoints: String(next.decimalPoint ?? "#0.00"),
      nCurrencyId: Number.isFinite(currencyId) ? currencyId : 0,
      cTimeZone: String(findValue(rawFeatures, ["cTimeZone", "cTimezone"]) ?? ""),
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      cSchemaName: String(requestPayload.cSchemaName ?? ""),
      cDbName: String(requestPayload.cDbName ?? ""),
    };
  };

  const updateAndSave = async <K extends keyof FeatureState>(key: K, value: FeatureState[K]) => {
    const previous = features;
    const next = { ...features, [key]: value };
    setFeatures(next);
    setIsSaving(true);
    try {
      await settingsApis.featuresSave(buildSavePayload(next));
      setRawFeatures((current) => ({ ...current, ...buildSavePayload(next) }));
      message.success("Feature settings updated.");
    } catch (error) {
      setFeatures(previous);
      message.error(getApiMessage(error, "Unable to update feature settings."));
    } finally {
      setIsSaving(false);
    }
  };

  const toggle = (key: FeatureKey) => (checked: boolean) => void updateAndSave(key, checked);
  const disabled = isLoading || isSaving;

  return (
    <div className="mx-auto flex h-[calc(100vh-92px)] min-h-0 w-full max-w-[1100px] flex-col overflow-hidden py-4">
      <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-slate-950">Features</h1>
      {loadError ? <Alert className="mb-3" type="error" showIcon message={loadError} /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-sky-300/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Spin spinning={isLoading}>
          <section className="rounded-lg border border-sky-200 bg-white px-5">
          <FeatureRow title="Asset" description="Toggle asset management feature on or off. When enabled, you can track, manage, and audit all assets." checked={features.asset} onChange={toggle("asset")} disabled={disabled} />
          <FeatureRow title="Email" description="Email management feature on or off. When enabled, you can track, manage, and audit all emails." checked={features.email} onChange={toggle("email")} disabled={disabled} />

          <div className="border-b border-slate-200 py-5">
            <h2 className="m-0 mb-3 text-[16px] font-semibold text-slate-950">Number Reset</h2>
            <div className="grid max-w-[620px] grid-cols-[minmax(130px,1fr)_180px_auto] items-center gap-x-5 gap-y-2 text-[13px] text-slate-600">
              <span>Bill No reset from</span>
              <MasterDateField value={features.billResetDate} disabled={disabled} onChange={(value) => void updateAndSave("billResetDate", value)} />
              <Switch checked={features.billReset} disabled={disabled} onChange={toggle("billReset")} />
              <span>Ticket No reset from</span>
              <MasterDateField value={features.ticketResetDate} disabled={disabled} onChange={(value) => void updateAndSave("ticketResetDate", value)} />
              <Switch checked={features.ticketReset} disabled={disabled} onChange={toggle("ticketReset")} />
            </div>
          </div>

          <FeatureRow title="Billing" description="When enabled, you can track, manage, and audit all billing." checked={features.billing} onChange={toggle("billing")} disabled={disabled} />
          <FeatureRow title="Call Report Part Taken for Repair and Replace" description="Show the part taken for repair and replace feature on or off." checked={features.repairAndReplace} onChange={toggle("repairAndReplace")} disabled={disabled} />
          <FeatureRow title="Closed Ticket Verification" description="Toggle closed ticket verification feature on or off." checked={features.closedTicketVerification} onChange={toggle("closedTicketVerification")} disabled={disabled} />
          <FeatureRow title="Allow Multiple Progress" description="Multiple progress feature on or off." checked={features.multipleProgress} onChange={toggle("multipleProgress")} disabled={disabled} />
          <FeatureRow title="Call Report Sign" description="Toggle call report sign feature on or off." checked={features.callReportSign} onChange={toggle("callReportSign")} disabled={disabled} />
          <FeatureRow title="Location on Call Report" description="Toggle location on call report feature on or off." checked={features.locationOnCallReport} onChange={toggle("locationOnCallReport")} disabled={disabled} />
          <FeatureRow title="OTP Verification" description="Toggle OTP Verification feature on or off." checked={features.otpVerification} onChange={toggle("otpVerification")} disabled={disabled} />
          <FeatureRow title="Generate Ticket Acknowledgment" description="Toggle Generate Ticket Acknowledgment feature on or off." checked={features.ticketAcknowledgment} onChange={toggle("ticketAcknowledgment")} disabled={disabled} />

          <div className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-[120px_minmax(180px,260px)] sm:items-center">
            <label className="text-[14px] font-medium text-slate-950">Default Currency</label>
            <Select className="w-full" value={features.currencyId || undefined} options={currencies} placeholder="Select currency" disabled={disabled} onChange={(value) => void updateAndSave("currencyId", value)} />
          </div>
          <div className="grid gap-4 border-b border-slate-200 py-5 sm:grid-cols-[120px_minmax(180px,260px)] sm:items-center">
            <label className="text-[14px] font-medium text-slate-950">Decimal Point</label>
            <Input className="w-[120px]" value={features.decimalPoint} disabled={disabled} onChange={(event) => setFeatures((current) => ({ ...current, decimalPoint: event.target.value }))} onBlur={() => void updateAndSave("decimalPoint", features.decimalPoint)} />
          </div>

          <FeatureRow title="Item Repair Verification" description="User Verification is required after an item is repaired by the agent." checked={features.itemRepairVerification} onChange={toggle("itemRepairVerification")} disabled={disabled} />
          <div className="py-5">
            <h2 className="m-0 text-[16px] font-semibold text-slate-950">Set Hierarchy for Part Need External Repair</h2>
            <p className="mt-2 max-w-[850px] text-[13px] leading-5 text-slate-600">When a part requires external repair, the agent marks it and the admin assigns it to an external vendor. After the vendor completes the repair, the user updates the status based on the hierarchy, and the agent then resumes the repair process.</p>
            <div className="mt-3 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-slate-600">
              <label className="flex items-center gap-3">Verification Required <Switch size="small" checked={features.verificationRequired} disabled={disabled} onChange={toggle("verificationRequired")} /></label>
              <label className="flex items-center gap-3">Part Return to Agent <Switch size="small" checked={features.partReturnToAgent} disabled={disabled} onChange={toggle("partReturnToAgent")} /></label>
            </div>
          </div>
          </section>
        </Spin>
      </div>
    </div>
  );
};

export default FeaturesPage;
