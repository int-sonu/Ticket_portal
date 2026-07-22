/* eslint-disable @typescript-eslint/no-explicit-any -- Company detail fields differ across tenant versions. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select, Spin, message } from "antd";

import { settingsApis } from "../../Axios/SettingsApi";
import { getApiImageBaseUrl } from "../../Axios/config";
import { getRequestPayload } from "../../Utils/requestPayload";
import { getApiMessage, isApiSuccess } from "../Master/Common/SimpleMasterUtils";

type CompanyForm = {
  companyName: string;
  shortName: string;
  address: string;
  email: string;
  phone: string;
  state: string;
  website: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  gstNo: string;
  fssaiNo: string;
  cin: string;
  msmeNo: string;
  logoUrl: string;
};

const initialForm: CompanyForm = {
  companyName: "", shortName: "", address: "", email: "", phone: "", state: "", website: "",
  accountNumber: "", accountHolderName: "", ifscCode: "", bankName: "", branchName: "",
  gstNo: "", fssaiNo: "", cin: "", msmeNo: "", logoUrl: "",
};

const fieldAliases: Record<keyof CompanyForm, string[]> = {
  companyName: ["cCompanyName"],
  shortName: ["cShName"],
  address: ["cAddress"],
  email: ["cEmail"],
  phone: ["cPhoneNo"],
  state: ["cStateName", "cState", "stateName", "state"],
  website: ["cWebsite"],
  accountNumber: ["cAccountNumber"],
  accountHolderName: ["cAccountHolderName"],
  ifscCode: ["cIsfcCode"],
  bankName: ["cBankName"],
  branchName: ["cBranchName"],
  gstNo: ["cGstNo"],
  fssaiNo: ["cFssaiNo"],
  cin: ["cCinNo"],
  msmeNo: ["cMsmeNo"],
  logoUrl: ["cLogoUrl"],
};

const getValue = (record: Record<string, any>, aliases: string[]) => {
  const key = Object.keys(record || {}).find((item) => aliases.some((alias) => alias.toLowerCase() === item.toLowerCase()));
  return key ? record[key] : "";
};

const unwrapRecord = (response: any): Record<string, any> => {
  const candidates = [response?.data?.data, response?.data, response?.result, response?.companyDetails, response?.message, response];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate[0] && typeof candidate[0] === "object") return candidate[0];
    if (candidate && !Array.isArray(candidate) && typeof candidate === "object") {
      const nestedArray = Object.values(candidate).find(Array.isArray) as any[] | undefined;
      if (nestedArray?.[0] && typeof nestedArray[0] === "object") return nestedArray[0];
      return candidate;
    }
  }
  return {};
};

const mapCompany = (record: Record<string, any>) => {
  const result = { ...initialForm };
  (Object.keys(result) as Array<keyof CompanyForm>).forEach((key) => {
    result[key] = String(getValue(record, fieldAliases[key]) ?? "");
  });
  return result;
};

const imageUrl = (path: string) => {
  if (!path) return "";
  if (/^(https?:|data:)/i.test(path)) return path;
  try {
    return `${getApiImageBaseUrl().replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  } catch {
    return path;
  }
};

const stateEntries: Array<[string, number]> = [
  ["Jammu and Kashmir", 1], ["Himachal Pradesh", 2], ["Punjab", 3], ["Chandigarh", 4], ["Uttarakhand", 5],
  ["Haryana", 6], ["Delhi", 7], ["Rajasthan", 8], ["Uttar Pradesh", 9], ["Bihar", 10], ["Sikkim", 11],
  ["Arunachal Pradesh", 12], ["Nagaland", 13], ["Manipur", 14], ["Mizoram", 15], ["Tripura", 16],
  ["Meghalaya", 17], ["Assam", 18], ["West Bengal", 19], ["Jharkhand", 20], ["Odisha", 21],
  ["Chhattisgarh", 22], ["Madhya Pradesh", 23], ["Gujarat", 24],
  ["Dadra and Nagar Haveli and Daman and Diu", 26], ["Maharashtra", 27], ["Karnataka", 29], ["Goa", 30],
  ["Lakshadweep", 31], ["Kerala", 32], ["Tamil Nadu", 33], ["Puducherry", 34],
  ["Andaman and Nicobar Islands", 35], ["Telangana", 36], ["Andhra Pradesh", 37], ["Ladakh", 38],
];
const stateOptions = stateEntries.map(([state]) => ({ value: state, label: state }));

const Field = ({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) => (
  <label className="block">
    <span className="mb-1 block text-[12px] text-slate-700">{label}</span>
    <Input value={value} readOnly={!editing} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const CompanyDetailsPage = () => {
  const requestPayload = useMemo(() => getRequestPayload(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [rawDetails, setRawDetails] = useState<Record<string, any>>({});
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      settingsApis.getCompanyDetails(requestPayload),
      settingsApis.getCompanyFeatures(requestPayload),
    ])
      .then(([detailsResponse]) => {
        if (!active) return;
        const record = unwrapRecord(detailsResponse);
        const nextForm = mapCompany(record);
        setRawDetails(record);
        setForm(nextForm);
        setLogoPreview(imageUrl(nextForm.logoUrl));
      })
      .catch((error) => message.error(getApiMessage(error, "Unable to load company details.")))
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [requestPayload]);

  const updateField = (key: keyof CompanyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      setLogoPreview(result);
      setLogoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.companyName.trim()) {
      message.warning("Please enter company name.");
      return;
    }
    const loadedState = String(getValue(rawDetails, fieldAliases.state) ?? "");
    const selectedStateCode = stateEntries.find(([name]) => name === form.state)?.[1] ?? 0;
    const currentStateId = Number(getValue(rawDetails, ["nStateId"]) ?? 0);
    const currentStateCode = Number(getValue(rawDetails, ["nStateCode"]) ?? 0);
    const stateId = form.state === loadedState && currentStateId ? currentStateId : selectedStateCode;
    const stateCode = form.state === loadedState && currentStateCode ? currentStateCode : selectedStateCode;
    const payload = new FormData();
    const fields: Record<string, string | number | boolean> = {
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      nAgentId: Number(requestPayload.id ?? requestPayload.nAgentId ?? 0),
      cCompanyName: form.companyName,
      cShName: form.shortName,
      cAddress: form.address,
      cEmail: form.email,
      cPhoneNo: form.phone,
      nStateId: stateId,
      cWebsite: form.website,
      cGstNo: form.gstNo,
      cCinNo: form.cin,
      cFssaiNo: form.fssaiNo,
      cMsmeNo: form.msmeNo,
      cState: form.state,
      nStateCode: stateCode,
      cAccountHolderName: form.accountHolderName,
      cAccountNumber: form.accountNumber,
      cIsfcCode: form.ifscCode,
      cBankName: form.bankName,
      cBranchName: form.branchName,
      bRemoveLogo: false,
      cSchemaName: String(requestPayload.cSchemaName ?? ""),
      cDbName: String(requestPayload.cDbName ?? ""),
    };
    Object.entries(fields).forEach(([key, value]) => payload.append(key, String(value)));
    if (logoFile) payload.append("logo", logoFile, logoFile.name);
    setIsSaving(true);
    try {
      const response = await settingsApis.updateCompanyDetails(payload);
      if (!isApiSuccess(response)) throw new Error(getApiMessage(response, "Unable to update company details."));
      setRawDetails((current) => ({ ...current, ...fields }));
      setLogoFile(null);
      setEditing(false);
      message.success("Company details updated successfully.");
    } catch (error) {
      message.error(getApiMessage(error, "Unable to update company details."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-92px)] min-h-0 w-full max-w-[1100px] flex-col overflow-hidden py-3">
      <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-slate-950">Company Details</h1>
      <div className="min-h-0 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-sky-300/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Spin spinning={isLoading}>
          <section className="rounded-lg border border-sky-200 bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-0">
              <div className="space-y-3 lg:border-r lg:border-slate-200 lg:pr-4">
                <Field label="Company Name" value={form.companyName} editing={editing} onChange={(value) => updateField("companyName", value)} />
                <Field label="Short Name" value={form.shortName} editing={editing} onChange={(value) => updateField("shortName", value)} />
                <label className="block"><span className="mb-1 block text-[12px] text-slate-700">Address</span><Input.TextArea rows={3} value={form.address} readOnly={!editing} onChange={(event) => updateField("address", event.target.value)} /></label>
                <Field label="Email" value={form.email} editing={editing} onChange={(value) => updateField("email", value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone Number" value={form.phone} editing={editing} onChange={(value) => updateField("phone", value)} />
                  <label className="block"><span className="mb-1 block text-[12px] text-slate-700">State</span><Select showSearch optionFilterProp="label" value={form.state || undefined} disabled={!editing} options={stateOptions} onChange={(value) => updateField("state", value)} className="w-full" /></label>
                </div>
                <Field label="Website" value={form.website} editing={editing} onChange={(value) => updateField("website", value)} />
                <div><span className="mb-2 block text-[12px] text-slate-700">Logo</span><button type="button" disabled={!editing} onClick={() => fileInputRef.current?.click()} className="flex h-[125px] w-[125px] items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-white disabled:cursor-default">{logoPreview ? <img src={logoPreview} alt="Company logo" className="h-full w-full object-contain" /> : <span className="text-xs text-slate-400">Upload logo</span>}</button><input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleLogo(event.target.files?.[0])} /></div>
              </div>

              <div className="space-y-3 lg:pl-4">
                <Field label="Account Number" value={form.accountNumber} editing={editing} onChange={(value) => updateField("accountNumber", value)} />
                <Field label="Account Holder Name" value={form.accountHolderName} editing={editing} onChange={(value) => updateField("accountHolderName", value)} />
                <Field label="IFSC Code" value={form.ifscCode} editing={editing} onChange={(value) => updateField("ifscCode", value)} />
                <Field label="Bank Name" value={form.bankName} editing={editing} onChange={(value) => updateField("bankName", value)} />
                <Field label="Branch Name" value={form.branchName} editing={editing} onChange={(value) => updateField("branchName", value)} />
                <div className="grid grid-cols-2 gap-4"><Field label="GST No" value={form.gstNo} editing={editing} onChange={(value) => updateField("gstNo", value)} /><Field label="FSSAI No" value={form.fssaiNo} editing={editing} onChange={(value) => updateField("fssaiNo", value)} /></div>
                <div className="grid grid-cols-2 gap-4"><Field label="CIN" value={form.cin} editing={editing} onChange={(value) => updateField("cin", value)} /><Field label="MSME No" value={form.msmeNo} editing={editing} onChange={(value) => updateField("msmeNo", value)} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  {editing ? <Button type="primary" loading={isSaving} className="bg-emerald-500" onClick={() => void save()}>Save</Button> : <Button type="primary" className="bg-emerald-500" onClick={() => setEditing(true)}>Edit</Button>}
                </div>
              </div>
            </div>
          </section>
        </Spin>
      </div>
    </div>
  );
};

export default CompanyDetailsPage;
