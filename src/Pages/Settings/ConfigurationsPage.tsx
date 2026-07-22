/* eslint-disable @typescript-eslint/no-explicit-any -- Configuration response wrappers vary by tenant. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Spin, message } from "antd";
import {
  DeleteOutlined,
  FileTextOutlined,
  MailOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Editor } from "primereact/editor";
import type { EditorPassThroughOptions } from "primereact/editor";
import "primereact/resources/primereact.min.css";
import "quill/dist/quill.snow.css";
import "./ConfigurationsPage.css";

import { settingsApis } from "../../Axios/SettingsApi";
import { getApiImageBaseUrl } from "../../Axios/config";
import { getRequestPayload } from "../../Utils/requestPayload";
import { getApiMessage, isApiSuccess } from "../Master/Common/SimpleMasterUtils";

type ConfigurationValues = {
  cEstimateSubject: string;
  cEstimateBody: string;
  cBillSubject: string;
  cBillBody: string;
  cDeclaration: string;
  cEstimateDeclaration: string;
  cServiceReportDeclaration: string;
  cAcknowledgementBody: string;
  cAcknowledgementSubject: string;
  cServiceReportSubject: string;
  cServiceReportBody: string;
  image: string;
};

const initialValues: ConfigurationValues = {
  cEstimateSubject: "", cEstimateBody: "", cBillSubject: "", cBillBody: "", cDeclaration: "",
  cEstimateDeclaration: "", cServiceReportDeclaration: "", cAcknowledgementBody: "",
  cAcknowledgementSubject: "", cServiceReportSubject: "", cServiceReportBody: "", image: "",
};

const unwrapRecord = (response: any): Record<string, any> => {
  const candidates = [response?.data?.data, response?.data, response?.result, response?.configuration, response?.message, response];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate[0] && typeof candidate[0] === "object") return candidate[0];
    if (candidate && !Array.isArray(candidate) && typeof candidate === "object") {
      const nested = Object.values(candidate).find(Array.isArray) as any[] | undefined;
      if (nested?.[0] && typeof nested[0] === "object") return nested[0];
      return candidate;
    }
  }
  return {};
};

const readText = (record: Record<string, any>, ...keys: string[]) => {
  const key = Object.keys(record || {}).find((item) => keys.some((candidate) => candidate.toLowerCase() === item.toLowerCase()));
  return key ? String(record[key] ?? "") : "";
};

const resolveImage = (path: string) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  try {
    return `${getApiImageBaseUrl().replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
  } catch {
    return path;
  }
};

const tabs = [
  { key: 1, title: "Email Template For Estimate", icon: <MailOutlined /> },
  { key: 2, title: "Email Template For Bill", icon: <MailOutlined /> },
  { key: 3, title: "Estimate & Bill Template", icon: <FileTextOutlined /> },
];

const editorPassThrough: EditorPassThroughOptions = {
  root: {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "270px",
      minHeight: 0,
    },
  },
  toolbar: {
    style: {
      order: 1,
      flex: "0 0 auto",
      borderColor: "#bae0ff",
      borderTop: 0,
    },
  },
  content: {
    style: {
      order: 0,
      minHeight: 0,
      flex: "1 1 auto",
      border: "1px solid #bae0ff",
    },
  },
};

const ConfigurationsPage = () => {
  const requestPayload = useMemo(() => getRequestPayload(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(1);
  const [values, setValues] = useState(initialValues);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void settingsApis.getConfiguration(requestPayload)
      .then((response) => {
        if (!active) return;
        const data = unwrapRecord(response);
        setValues({
          cEstimateSubject: readText(data, "cEstimateSubject"),
          cEstimateBody: readText(data, "cEstimateBody"),
          cBillSubject: readText(data, "cBillSubject", "cbillSubject"),
          cBillBody: readText(data, "cBillBody"),
          cDeclaration: readText(data, "cDeclaration", "cBillDeclaration"),
          cEstimateDeclaration: readText(data, "cEstimateDeclaration"),
          cServiceReportDeclaration: readText(data, "cServiceReportDeclaration"),
          cAcknowledgementBody: readText(data, "cAcknowledgementBody"),
          cAcknowledgementSubject: readText(data, "cAcknowledgementSubject"),
          cServiceReportSubject: readText(data, "cServiceReportSubject"),
          cServiceReportBody: readText(data, "cServiceReportBody"),
          image: resolveImage(readText(data, "cHeaderBanner", "headerBanner", "image")),
        });
      })
      .catch((error) => message.error(getApiMessage(error, "Unable to load configurations.")))
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [requestPayload]);

  const setValue = (key: keyof ConfigurationValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const selectImage = (file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      message.warning("Image must be smaller than 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue("image", String(reader.result ?? ""));
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const save = async () => {
    const payload = new FormData();
    const fields: Record<string, string | number> = {
      cDeclaration: values.cDeclaration,
      cEstimateDeclaration: values.cEstimateDeclaration,
      cServiceReportDeclaration: values.cServiceReportDeclaration,
      cBillBody: values.cBillBody,
      cBillSubject: values.cBillSubject,
      cEstimateBody: values.cEstimateBody,
      cEstimateSubject: values.cEstimateSubject,
      cAcknowledgementBody: values.cAcknowledgementBody,
      cAcknowledgementSubject: values.cAcknowledgementSubject,
      cServiceReportSubject: values.cServiceReportSubject,
      cServiceReportBody: values.cServiceReportBody,
      nCompanyId: Number(requestPayload.nCompanyId ?? 0),
      nAgentId: Number(requestPayload.id ?? requestPayload.nAgentId ?? 0),
      cSchemaName: String(requestPayload.cSchemaName ?? ""),
      cDbName: String(requestPayload.cDbName ?? ""),
    };
    Object.entries(fields).forEach(([key, value]) => payload.append(key, String(value)));
    if (imageFile) payload.append("file", imageFile, imageFile.name);
    setIsSaving(true);
    try {
      const response = await settingsApis.configurationSave(payload);
      if (!isApiSuccess(response)) throw new Error(getApiMessage(response, "Unable to save configurations."));
      setImageFile(null);
      message.success("Saved Successfully.");
    } catch (error) {
      message.error(getApiMessage(error, "Unable to save configurations."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-92px)] min-h-0 flex-col py-3">
      <h1 className="mb-4 shrink-0 text-[20px] font-semibold text-slate-950">Configurations</h1>
      <Spin spinning={isLoading} className="min-h-0 flex-1 ">
        <section className="relative flex h-full min-h-[500px] overflow-hidden rounded-lg border border-sky-200 bg-white">
          <nav className="w-[200px] shrink-0 border-r border-sky-200 bg-sky-50 p-4">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`mb-2 flex w-full items-center gap-4 rounded-md border px-4 py-3 text-left text-[13px] font-semibold ${activeTab === tab.key ? "border-sky-500 bg-blue-100" : "border-transparent"}`}>
                <span className="text-[24px] text-sky-500">{tab.icon}</span><span>{tab.title}</span>
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto p-4 pb-20">
            {activeTab === 1 ? <><label className="block"><span className="mb-1 block text-xs text-slate-600">Subject</span><Input value={values.cEstimateSubject} onChange={(event) => setValue("cEstimateSubject", event.target.value)} /></label><div className="mt-3"><div className="mb-1 text-xs text-slate-600">Body</div><Editor className="configuration-editor" pt={editorPassThrough} value={values.cEstimateBody} onTextChange={(event) => setValue("cEstimateBody", event.htmlValue ?? "")} /></div></> : null}
            {activeTab === 2 ? <><label className="block"><span className="mb-1 block text-xs text-slate-600">Subject</span><Input value={values.cBillSubject} onChange={(event) => setValue("cBillSubject", event.target.value)} /></label><div className="mt-3"><div className="mb-1 text-xs text-slate-600">Body</div><Editor className="configuration-editor" pt={editorPassThrough} value={values.cBillBody} onTextChange={(event) => setValue("cBillBody", event.htmlValue ?? "")} /></div></> : null}
            {activeTab === 3 ? <>
            <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} onKeyDown={(event) => { if (event.key === "Enter") fileRef.current?.click(); }} className="relative flex h-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-400 hover:border-sky-300">{values.image ? <><img src={values.image} alt="Header banner" className="h-full w-full object-contain" /><Button danger type="primary" size="small" icon={<DeleteOutlined />} className="absolute bottom-2 right-2" onClick={(event) => { event.stopPropagation(); setValue("image", ""); setImageFile(null); }} /></> : <div className="text-center"><UploadOutlined className="text-3xl text-emerald-500" /><p className="mt-2 text-xs font-medium">Drop your image here <span className="font-normal text-slate-400">(555px × 86px), PNG, JPG or WEBP, max 8 MB</span></p><Button size="small" type="primary" className="bg-slate-950">Upload</Button></div>}<input ref={fileRef} hidden type="file" accept=".jpeg,.jpg,.png,.webp" onChange={(event) => selectImage(event.target.files?.[0])} /></div><label className="mt-3 block"><span className="mb-1 block text-xs text-slate-600">Bill Declaration</span><Input value={values.cDeclaration} onChange={(event) => setValue("cDeclaration", event.target.value)} /></label></> : null}
          </div>

          <Button type="primary" loading={isSaving} className="absolute bottom-4 right-4 min-w-[74px] bg-emerald-500" onClick={() => void save()}>Save</Button>
        </section>
      </Spin>
    </div>
  );
};

export default ConfigurationsPage;
