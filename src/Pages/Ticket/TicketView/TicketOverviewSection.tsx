import { Card, Empty, Image, Spin } from "antd";
import { useRef } from "react";

import addressIcon from "../../../assets/icons/AddressIcon.svg";
import assetIcon from "../../../assets/icons/Asseticon.svg";
import groupIcon from "../../../assets/icons/GroupIcon.svg";
import shareIcon from "../../../assets/icons/shareIcon.svg";
import serviceTypeIcon from "../../../assets/icons/servicetypeicon.svg";
import ticketSmallIcon from "../../../assets/icons/ticketSmallIcon.svg";
import calendarIcon from "../../../assets/icons/calenderiCon.svg";
import TicketHistory from "../TicketHistory/TicketHistory";

type TicketOverviewSectionProps = {
  ticketId: number;
  isLoading: boolean;
  activeTab: "details" | "history" | "files";
  onTabChange: (tab: "details" | "history" | "files") => void;
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
};

const TicketOverviewSection = ({
  ticketId,
  isLoading,
  activeTab,
  onTabChange,
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
}: TicketOverviewSectionProps) => {
  const filesRef = useRef<HTMLDivElement | null>(null);

  const scrollFiles = (direction: "left" | "right") => {
    const el = filesRef.current;
    if (!el) return;
    const amount = 220;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  const leftRows = [
    { label: "Address", value: address, icon: addressIcon },
    { label: "Asset", value: assetName, icon: assetIcon },
    { label: "Ticket Source", value: source || "N/A", icon: ticketSmallIcon },
    { label: "Service Type", value: serviceType || "N/A", icon: serviceTypeIcon },
    { label: "Group", value: group || "N/A", icon: groupIcon },
    { label: "Follow Up", value: followupDate || "N/A", icon: calendarIcon },
  ];

  return (
    <Spin spinning={isLoading}>
      <div className="px-4 pb-3 sm:px-4 sm:pb-4">
        <div className="sticky top-0 z-30 flex items-end gap-3 border border-slate-200 border-b-0 bg-white rounded-tl-2xl shadow-[0_1px_0_rgba(226,232,240,1)]">
          <button
            type="button"
            onClick={() => onTabChange("details")}
            className={`rounded-tl-2xl px-5 py-1.5 text-sm font-semibold ${
              activeTab === "details"
                ? "bg-sky-500 text-white"
                : "text-slate-900 hover:bg-slate-50"
            }`}
          >
            Ticket Details
          </button>
          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={`rounded-t-sm px-4 py-1.5 text-sm font-semibold ${
              activeTab === "history"
                ? "bg-sky-500 text-white"
                : "text-slate-900 hover:bg-slate-50"
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => onTabChange("files")}
            className={`rounded-t-sm px-4 py-1.5 text-sm font-semibold ${
              activeTab === "files"
                ? "bg-sky-500 text-white"
                : "text-slate-900 hover:bg-slate-50"
            }`}
          >
            Files
          </button>
        </div>

        <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
          <div className="px-3 pt-1.5 sm:px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  Ticket No : {ticketNo || "N/A"}
                </div>
                <div className="text-base text-slate-900">{customerName || "-"}</div>
                <div className="text-sm text-slate-600">
                  Ticket Summary : {summary || "-"}
                </div>
                <div className="text-sm text-slate-700">
                  Description : {description || "-"}
                </div>
              </div>
              <div className="whitespace-nowrap text-xs text-slate-700">
                {createdDate ? `Ticket Created on ${createdDate}` : ""}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-y border-slate-200 bg-slate-100/80 px-3 py-2 sm:px-4">
            {priority ? (
              <span className="rounded border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-600">
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

          
        </Card>

        {activeTab === "details" ? (
          <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
          <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
            <div className="grid gap-1 px-3 py-2 sm:px-4">
              {leftRows.map((item) => (
                <div
                  key={item.label}
                  className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-2 rounded-md px-2 py-1 even:bg-slate-50"
                >
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <img src={item.icon} alt="" className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label} :</span>
                  </div>
                  <div className="break-words text-sm text-slate-800">
                    {item.value || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
            <div className="px-3 py-2 sm:px-4">
              <div className="flex items-center justify-between gap-4 rounded-lg bg-sky-50 p-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-900">
                    {customerName || "-"}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-600">
                    {contactNumber || "-"}
                  </div>
                  <div className="text-sm text-slate-600">{email || "-"}</div>
                </div>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"
                  aria-label="Share ticket"
                >
                  <img src={shareIcon} alt="" className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
          </div>
        ) : activeTab === "history" ? (
          <div className="relative z-10 mt-0.5">
            <TicketHistory ticketId={ticketId} />
          </div>
        ) : (
          <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
            <div className="border-b border-slate-200 px-4 py-3">
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
                    ‹
                  </button>
                  <div
                    ref={filesRef}
                    className="grid overflow-x-auto scroll-smooth px-7 pb-0.5"
                    style={{
                      gridAutoFlow: "column",
                      gridTemplateRows: "repeat(2, 116px)",
                      gridAutoColumns: "116px",
                      gap: "12px",
                    }}
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
                    ›
                  </button>
                </div>
              ) : (
                <Empty description="No files found" />
              )}
            </div>
          </Card>
        )}

      </div>
    </Spin>
  );
};

export default TicketOverviewSection;
