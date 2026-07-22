/* eslint-disable @typescript-eslint/no-explicit-any -- Notification response wrappers vary by tenant. */
import { useEffect, useMemo, useState } from "react";
import { Alert, Spin, Switch, message } from "antd";

import { settingsApis } from "../../Axios/SettingsApi";
import { getRequestPayload } from "../../Utils/requestPayload";
import { getApiMessage, isApiSuccess, toBooleanValue } from "../Master/Common/SimpleMasterUtils";

type NotificationKey =
  | "assigned"
  | "transferred"
  | "shared"
  | "unassigned"
  | "closedVerification"
  | "postponed";

type NotificationState = Record<NotificationKey, boolean>;

const initialState: NotificationState = {
  assigned: false,
  transferred: false,
  shared: false,
  unassigned: false,
  closedVerification: false,
  postponed: false,
};

const aliases: Record<NotificationKey, string[]> = {
  assigned: ["bAssignedTicket", "bAssignedTickets", "bAssigned", "assignedTicket"],
  transferred: ["bTransferredTicket", "bTransferredTickets", "bTransferred", "transferredTicket"],
  shared: ["bSharedTicket", "bSharedTickets", "bShared", "sharedTicket"],
  unassigned: ["bUnassignedTicket", "bUnassignedTickets", "bUnassigned", "unassignedTicket"],
  closedVerification: ["bClosedTicketVerification", "bReviewTicket", "bClosedVerification", "closedTicketVerification"],
  postponed: ["bPostponedTicket", "bPostponedTickets", "bPostponed", "postponedTicket"],
};

const notificationOptionIds: Record<NotificationKey, string> = {
  assigned: "1",
  transferred: "2",
  shared: "3",
  unassigned: "4",
  closedVerification: "5",
  postponed: "6",
};

const findValue = (record: Record<string, any>, keys: string[]) => {
  const key = Object.keys(record || {}).find((item) =>
    keys.some((candidate) => candidate.toLowerCase() === item.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const unwrapRecord = (response: any): Record<string, any> => {
  const candidates = [response?.data?.data, response?.data?.message, response?.message, response?.result, response?.settings, response?.data, response];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!Array.isArray(candidate) && typeof candidate === "object") return candidate;
    if (Array.isArray(candidate)) {
      if (candidate.length === 1 && typeof candidate[0] === "object") return candidate[0];
      return candidate.reduce((result, item) => {
        const name = item?.cNotificationName ?? item?.cSettingName ?? item?.name;
        const value = item?.bEnabled ?? item?.bActive ?? item?.value;
        if (name) result[String(name).replace(/[^a-z0-9]/gi, "")] = value;
        return result;
      }, {} as Record<string, any>);
    }
  }
  return {};
};

const mapSettings = (
  notificationRecord: Record<string, any>,
  companyFeatures: Record<string, any>,
) => {
  const next = { ...initialState };
  const selectedOptions = findValue(notificationRecord, ["cNotiOptions", "notiOptions"]);
  if (selectedOptions !== undefined && selectedOptions !== null) {
    const selected = new Set(
      (Array.isArray(selectedOptions) ? selectedOptions : String(selectedOptions).split(/[,;|]/))
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean),
    );
    (Object.keys(next) as NotificationKey[]).forEach((key) => {
      const names = aliases[key].map((value) => value.toLowerCase());
      next[key] = selected.has(notificationOptionIds[key]) || names.some((name) => selected.has(name));
    });
    return next;
  }
  (Object.keys(next) as NotificationKey[]).forEach((key) => {
    const notificationValue = findValue(notificationRecord, aliases[key]);
    const featureValue = key === "closedVerification"
      ? findValue(companyFeatures, aliases.closedVerification)
      : undefined;
    next[key] = toBooleanValue(notificationValue ?? featureValue, false);
  });
  return next;
};

const notificationRows: Array<{
  key: NotificationKey;
  title: string;
  description: string;
}> = [
  { key: "assigned", title: "Assigned Tickets", description: "Notifications For Assigned Tickets will be turned on or off." },
  { key: "transferred", title: "Transferred Tickets", description: "Notifications For Transferred Tickets will be turned on or off." },
  { key: "shared", title: "Shared Tickets", description: "Notifications For Shared Tickets will be turned on or off." },
  { key: "unassigned", title: "Unassigned Tickets", description: "Notifications For Unassigned Tickets will be turned on or off." },
  { key: "closedVerification", title: "Closed Tickets Verification", description: "Notifications For Closed Tickets Verification will be turned on or off." },
  { key: "postponed", title: "Postponed Tickets", description: "Notifications For Postponed Tickets will be turned on or off." },
];

const NotificationSettingsPage = () => {
  const requestPayload = useMemo(() => getRequestPayload(), []);
  const [settings, setSettings] = useState(initialState);
  const [rawSettings, setRawSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([
      settingsApis.getNotificationSettings(requestPayload),
      settingsApis.getCompanyFeatures(requestPayload),
    ])
      .then(([notificationResponse, featureResponse]) => {
        if (!active) return;
        const notificationRecord = unwrapRecord(notificationResponse);
        setRawSettings(notificationRecord);
        setSettings(mapSettings(notificationRecord, unwrapRecord(featureResponse)));
      })
      .catch((error) => {
        if (active) setLoadError(getApiMessage(error, "Unable to load notification settings."));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestPayload]);

  const saveSetting = async (key: NotificationKey, checked: boolean) => {
    const previous = settings;
    const next = { ...settings, [key]: checked };
    setSettings(next);
    setIsSaving(true);
    const activeOptions = (Object.keys(next) as NotificationKey[])
      .filter((option) => next[option])
      .map((option) => notificationOptionIds[option])
      .join(",");
    const payload = {
      ...requestPayload,
      nSettingsId: Number(findValue(rawSettings, ["nSettingsId", "settingsId", "id"]) ?? 0),
      nAgentId: Number(requestPayload.nAgentId ?? requestPayload.id ?? 0),
      nCreatedBy: Number(requestPayload.id ?? requestPayload.nAgentId ?? 0),
      cNotiOptions: activeOptions,
    };
    try {
      const response = await settingsApis.notificationSettingsSave(payload);
      if (!isApiSuccess(response)) throw new Error(getApiMessage(response, "Notification update failed."));
      setRawSettings((current) => ({ ...current, ...payload }));
      message.success("Notification settings updated.");
    } catch (error) {
      setSettings(previous);
      message.error(getApiMessage(error, "Unable to update notification settings."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-92px)] min-h-0 w-full max-w-[1100px] flex-col overflow-hidden bg-white py-3">
      <h1 className="m-0 shrink-0 border-b border-sky-100 px-5 pb-4 text-[20px] font-medium text-slate-950">Notification Settings</h1>
      {loadError ? <Alert className="mx-5 mt-3" type="error" showIcon message={loadError} /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-white [&::-webkit-scrollbar-thumb]:bg-sky-300/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Spin spinning={isLoading}>
          <div className="px-5">
            {notificationRows.map((row) => (
              <div key={row.key} className="flex items-start justify-between gap-6 border-b border-slate-200 py-6">
                <div>
                  <h2 className="m-0 text-[16px] font-semibold text-slate-950">{row.title}</h2>
                  <p className="mt-2 text-[13px] text-slate-600">{row.description}</p>
                </div>
                <Switch
                  className="mt-0.5 shrink-0"
                  checked={settings[row.key]}
                  disabled={isLoading || isSaving}
                  loading={isSaving}
                  onChange={(checked) => void saveSetting(row.key, checked)}
                />
              </div>
            ))}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
