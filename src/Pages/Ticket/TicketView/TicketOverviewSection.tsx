import { EditOutlined } from "@ant-design/icons";
import { Empty, Image, Spin } from "antd";
import { useRef } from "react";

import addressIcon from "../../../assets/icons/AddressIcon.svg";
import assetIcon from "../../../assets/icons/Asseticon.svg";
import calendarIcon from "../../../assets/icons/calenderiCon.svg";
import groupIcon from "../../../assets/icons/GroupIcon.svg";
import phoneIcon from "../../../assets/icons/PhoneIcon.svg";
import serviceTypeIcon from "../../../assets/icons/servicetypeicon.svg";
import ticketSmallIcon from "../../../assets/icons/ticketSmallIcon.svg";
import TicketHistory from "../TicketHistory/TicketHistory";
import data from "../../../assets/icons/data.gif";
type TicketOverviewSectionProps = {
  ticketId: number;
  isLoading: boolean;
  activeTab: "details" | "history" | "files";
  onTabChange: (tab: "details" | "history" | "files") => void;
  onEditAssetClick?: () => void;
  ticketNo: string;
  customerName: string;
  summary: string;
  description: string;
  createdDate: string;
  priority: string;
  status: string;
  ticketAge: string;
  followupDate: string;
  address: string;
  assetName: string;
  source: string;
  serviceType: string;
  group: string;
  contactNumber: string;
  email: string;
  attachments: any[];
  createdByTeam?: string;
  alternativeContacts?: any[];
  onFollowUpClick?: () => void;
  showFilesInDetails?: boolean;
  showFilesTab?: boolean;
  extraRows?: Array<{
    label: string;
    value: string;
    icon?: string;
  }>;
  showFollowUpAction?: boolean;
  previousCallReport?: {
    title?: string;
    remarks?: string;
    dateText?: string;
    createdBy?: string;
  } | null;
};

const TicketOverviewSection = ({
  ticketId,
  isLoading,
  activeTab,
  onTabChange,
  onEditAssetClick,
  ticketNo,
  customerName,
  summary,
  description,
  createdDate,
  priority,
  status,
  ticketAge,
  followupDate,
  address,
  assetName,
  source,
  serviceType,
  group,
  contactNumber,
  email,
  attachments,
  createdByTeam,
  alternativeContacts = [],
  onFollowUpClick,
  showFilesInDetails = true,
  showFilesTab = true,
  extraRows = [],
  showFollowUpAction = true,
  previousCallReport = null,
}: TicketOverviewSectionProps) => {
  const filesRef = useRef<HTMLDivElement | null>(null);

  const scrollFiles = (direction: "left" | "right") => {
    const el = filesRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  };

  const detailRows = [
    { label: "Address", value: address, icon: addressIcon },
    { label: "Asset", value: assetName, icon: assetIcon },
    { label: "Ticket Source", value: source || "N/A", icon: ticketSmallIcon },
    {
      label: "Service Type",
      value: serviceType || "N/A",
      icon: serviceTypeIcon,
    },
    { label: "Group", value: group || "N/A", icon: groupIcon },
    { label: "Follow Up", value: followupDate || "N/A", icon: calendarIcon },
    ...extraRows,
  ];

  const getContactValue = (item: any, keys: string[]) => {
    for (const key of keys) {
      if (
        item?.[key] !== undefined &&
        item?.[key] !== null &&
        item?.[key] !== ""
      ) {
        return item[key];
      }
    }

    const matchedKey = Object.keys(item || {}).find((field) =>
      keys.some((key) => key.toLowerCase() === field.toLowerCase()),
    );

    return matchedKey ? item?.[matchedKey] : "";
  };

  const alternativeContactList = Array.isArray(alternativeContacts)
    ? alternativeContacts
    : [];

  const FilesSection = ({
    variant = "carousel",
  }: {
    variant?: "carousel" | "list";
  }) => {
    if (variant === "list") {
      return (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-2">
            <div className="text-sm font-semibold text-slate-900">Files</div>
          </div>
          <div className="files-list-scrollbar max-h-[calc(100vh-290px)] overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-4">
            {attachments.length > 0 ? (
              <div className="space-y-4">
                {attachments.map((file: any, index: number) => {
                  const preview =
                    file?.url ??
                    file?.Url ??
                    file?.thumbUrl ??
                    file?.ThumbUrl ??
                    file?.cFilePath ??
                    file?.cUrl ??
                    file?.fileUrl ??
                    file?.FileUrl ??
                    file?.path ??
                    file?.Path ??
                    file?.Location ??
                    file?.location ??
                    "";
                  const caption =
                    file?.name ??
                    file?.FileName ??
                    file?.cFileName ??
                    file?.cDocumentName ??
                    `File ${index + 1}`;

                  return (
                    <div
                      key={file?.uid ?? file?.id ?? `${caption}-${index}`}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <div className="shrink-0 text-sm text-slate-700">
                          {file?.createdOn || file?.date || file?.CreatedOn || ""}
                        </div>
                        <div className="min-w-0 rounded-md bg-sky-50 px-3 py-1 text-sm text-slate-700">
                          {caption}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                        {preview ? (
                          <Image
                            src={preview}
                            alt={caption}
                            width={120}
                            height={120}
                            className="h-[120px] w-[120px] object-cover"
                            preview={{ mask: false }}
                          />
                        ) : (
                          <div className="flex h-[120px] w-[120px] items-center justify-center bg-slate-100 text-xs text-slate-500">
                            No preview
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center">
              <img
                                          src={data}
                                          alt=""
                                          className="h-50 w-50"
                                         
                                          
                                        />
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2">
          <div className="text-sm font-semibold text-slate-900">Files</div>
        </div>
        <div className="px-3 py-3 sm:px-4">
          {attachments.length > 0 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => scrollFiles("left")}
                aria-label="Scroll files left"
                className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-2xl leading-none text-slate-500 shadow-sm hover:bg-white"
              >
                {"<"}
              </button>

              <div
                ref={filesRef}
                className="flex gap-3 overflow-x-auto scroll-smooth px-7 pb-1"
                style={{ scrollbarWidth: "none" }}
              >
                {attachments.map((file: any, index: number) => {
                  const preview =
                    file?.url ??
                    file?.Url ??
                    file?.thumbUrl ??
                    file?.ThumbUrl ??
                    file?.cFilePath ??
                    file?.cUrl ??
                    file?.fileUrl ??
                    file?.FileUrl ??
                    file?.path ??
                    file?.Path ??
                    file?.Location ??
                    file?.location ??
                    "";
                  const caption =
                    file?.name ??
                    file?.FileName ??
                    file?.cFileName ??
                    file?.cDocumentName ??
                    `File ${index + 1}`;

                  return (
                    <div
                      key={file?.uid ?? file?.id ?? `${caption}-${index}`}
                      className="h-[116px] w-[116px] shrink-0 overflow-hidden rounded-sm border border-slate-200 bg-white"
                    >
                      {preview ? (
                        <Image
                          src={preview}
                          alt={caption}
                          width={116}
                          height={116}
                          className="h-[116px] w-[116px] rounded-sm object-cover"
                          preview={{ mask: false }}
                        />
                      ) : (
                        <div className="flex h-[116px] items-center justify-center bg-slate-100 text-xs text-slate-500">
                          No preview
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollFiles("right")}
                aria-label="Scroll files right"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-2xl leading-none text-slate-500 shadow-sm hover:bg-white"
              >
                {">"}
              </button>
            </div>
          ) : (
            <Empty description="No files" />
          )}
        </div>
      </div>
    );
  };

  return (
    <Spin spinning={isLoading}>
      <div className="relative z-10 flex min-h-0 w-full flex-col pb-3 sm:pb-5">
        <div className="flex min-h-0 w-full flex-col bg-white pb-3">
          <div className="sticky top-0 z-20 flex w-full items-end rounded-tr-2xl border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => onTabChange("details")}
              className={`px-4 py-2 text-center text-base font-medium ${
                activeTab === "details"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-50 text-black hover:bg-slate-100"
              }`}
            >
              Ticket Details
            </button>

            <button
              type="button"
              onClick={() => onTabChange("history")}
              className={`px-4 py-2 text-center text-base font-medium ${
                activeTab === "history"
                  ? "bg-sky-500 text-white"
                  : "bg-slate-50 text-black hover:bg-slate-100"
              }`}
            >
              History
            </button>

            {showFilesTab ? (
              <button
                type="button"
                onClick={() => onTabChange("files")}
                className={`px-4 py-2 text-center text-base font-medium ${
                  activeTab === "files"
                    ? "bg-sky-500 text-white"
                    : "bg-slate-50 text-black hover:bg-slate-100"
                }`}
              >
                Files
              </button>
            ) : null}
          </div>

          <div className="min-h-0 w-full pt-0">
            {activeTab !== "files" ? (
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="text-lg font-semibold text-black">
                      Ticket No : {ticketNo || "N/A"}
                    </div>
                    <div className="text-lg font-semibold text-black">
                      {customerName || "-"}
                    </div>
                    <div className="text-base text-black">{summary || "-"}</div>
                    <div className="text-sm text-slate-700">
                      Description : {description || "-"}
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-xs text-slate-700">
                    {createdDate ? `Ticket Created on ${createdDate}` : ""}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 bg-blue-200/30 px-2 py-2">
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {priority ? (
                      <span className="flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-600">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                        {priority}
                      </span>
                    ) : null}
                    {status ? (
                      <span className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-600">
                        {status}
                      </span>
                    ) : null}
                    {ticketAge ? (
                      <span className="rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-600">
                        {ticketAge}
                      </span>
                    ) : null}
                  </div>
                  {createdByTeam ? (
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      Ticket Created by {createdByTeam}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="min-h-0 w-full flex-1 py-3 pr-4">
              {activeTab === "details" ? (
                <>
                  <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white">
                        <div className="grid grid-cols-1 gap-1 px-3 py-3 sm:px-4">
                          {detailRows.map((item) => (
                            <div
                              key={item.label}
                              className="grid grid-cols-[120px_minmax(0,1fr)] items-start gap-2 rounded-md px-2 py-1.5"
                            >
                              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                {item.icon ? (
                                  <img
                                    src={item.icon}
                                    alt=""
                                    className="h-3.5 w-3.5 shrink-0"
                                  />
                                ) : null}
                                <span>{item.label} :</span>
                              </div>
                              <div className="flex items-center gap-2 break-words text-sm text-slate-800">
                                <span>{item.value || "N/A"}</span>
                                {item.label === "Asset" && onEditAssetClick ? (
                                  <button
                                    type="button"
                                    onClick={onEditAssetClick}
                                    aria-label="Edit asset"
                                    className="text-sky-600 hover:text-sky-700"
                                  >
                                    <EditOutlined className="text-[14px]" />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {previousCallReport ? (
                        <div className="rounded-xl border border-slate-200 bg-white">
                          <div className="flex items-start justify-between gap-3 px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900">
                              Previous Call Report Summary
                            </div>
                            <div className="text-xs text-slate-700">
                              {previousCallReport.title}
                              {previousCallReport.dateText
                                ? ` on ${previousCallReport.dateText}`
                                : ""}
                            </div>
                          </div>
                          {previousCallReport.remarks ? (
                            <div className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
                              {previousCallReport.remarks}
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {showFilesInDetails ? <FilesSection /> : null}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white">
                        <div className="px-3 py-3 sm:px-4">
                          <div className="mb-2 text-sm font-semibold text-slate-900">
                            Contacts
                          </div>
                          <div className="flex items-center justify-between gap-4 rounded-lg bg-sky-50 p-3">
                            <div className="min-w-0">
                              <div className="text-base font-semibold text-slate-900">
                                {customerName || "-"}
                              </div>
                              <div className="mt-0.5 text-sm text-slate-600">
                                {contactNumber || "-"}
                              </div>
                              <div className="text-sm text-slate-600">
                                {email || "-"}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"
                              aria-label="Call contact"
                            >
                              <img
                                src={phoneIcon}
                                alt=""
                                className="h-5 w-5"
                                style={{ filter: "invert(1) brightness(10)" }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white">
                        <div className="px-3 py-3 sm:px-4">
                          <div className="mb-2 text-sm font-semibold text-slate-900">
                            Alternative Contacts
                          </div>
                          <div className="flex flex-col gap-3">
                            {alternativeContactList.length ? (
                              alternativeContactList.map(
                                (contact: any, index: number) => {
                                  const altName =
                                    getContactValue(contact, [
                                      "cCustomerName",
                                      "CustomerName",
                                      "cContactName",
                                      "ContactName",
                                      "cContactPerson",
                                      "ContactPerson",
                                      "name",
                                    ]) || `Contact ${index + 1}`;
                                  const altPhone =
                                    getContactValue(contact, [
                                      "cContactNumber",
                                      "ContactNumber",
                                      "cPhoneNo",
                                      "PhoneNo",
                                      "mobile",
                                      "Mobile",
                                    ]) || "-";
                                  const altEmail =
                                    getContactValue(contact, [
                                      "cEmail",
                                      "Email",
                                      "email",
                                    ]) || "-";

                                  return (
                                    <div
                                      key={`${altName}-${index}`}
                                      className="flex items-center justify-between gap-4 rounded-lg bg-sky-50 p-3"
                                    >
                                      <div className="min-w-0">
                                        <div className="text-base font-semibold text-slate-900">
                                          {altName}
                                        </div>
                                        <div className="mt-0.5 text-sm text-slate-600">
                                          {altPhone}
                                        </div>
                                        <div className="text-sm text-slate-600">
                                          {altEmail}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"
                                        aria-label="Call alternative contact"
                                      >
                                        <img
                                          src={phoneIcon}
                                          alt=""
                                          className="h-5 w-5"
                                          style={{
                                            filter: "invert(1) brightness(10)",
                                          }}
                                        />
                                      </button>
                                    </div>
                                  );
                                },
                              )
                            ) : (
                              <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                                No alternative contacts found
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {showFollowUpAction ? (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={onFollowUpClick}
                        className="rounded-lg bg-emerald-500 px-6 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-600 active:bg-emerald-700"
                      >
                        FollowUp
                      </button>
                    </div>
                  ) : null}
                </>
              ) : activeTab === "history" ? (
                <div className="relative z-10">
                  <TicketHistory ticketId={ticketId} />
                </div>
              ) : (
                <FilesSection variant="list" />
              )}
            </div>
          </div>
        </div>
      </div>
    </Spin>
  );
};

export default TicketOverviewSection;
