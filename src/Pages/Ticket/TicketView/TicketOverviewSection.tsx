import { Card, Empty, Image, Spin } from "antd";
import { useRef } from "react";

type TicketOverviewSectionProps = {
  isLoading: boolean;
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
  isLoading,
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
    { label: "Address", value: address },
    { label: "Asset", value: assetName },
    { label: "Ticket Source", value: source || "N/A" },
    { label: "Service Type", value: serviceType || "N/A" },
    { label: "Group", value: group || "N/A" },
    { label: "Follow Up", value: followupDate || "N/A" },
  ];

  return (
    <Spin spinning={isLoading}>
      <div className="px-2 pb-2 sm:px-3 sm:pb-3">
        <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
          <div className="px-3 pt-1.5 sm:px-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  Ticket No : {ticketNo || "N/A"}
                </div>
                <div className="text-base font-medium text-slate-900">{customerName || "-"}</div>
                <div className="text-sm text-slate-600">{summary || "-"}</div>
                <div className="text-sm text-slate-700">Description : {description || "-"}</div>
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

        <div className="grid gap-2 lg:grid-cols-[1.02fr_1fr]">
          <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
            <div className="px-3 pt-1.5 sm:px-4">
              <div className="text-base font-semibold text-slate-900">Address</div>
            </div>

            <div className="grid gap-0 px-3 py-1.5 sm:px-4">
              {leftRows.map((item) => (
                <div key={item.label} className="flex items-start gap-3 py-1 last:border-b-0">
                  <div className="w-28 shrink-0 text-sm text-slate-700">{item.label} :</div>
                  <div className="text-sm text-slate-700">{item.value || "N/A"}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
            <div className="px-3 pt-1.5 sm:px-4">
              <div className="text-base font-semibold text-slate-900">Contacts</div>
            </div>

            <div className="px-3 py-1.5 sm:px-4">
              <div className="flex items-center justify-between rounded-sm bg-sky-50 p-3">
                <div>
                  <div className="text-base font-semibold text-slate-900">{customerName || "-"}</div>
                  <div className="mt-1 text-sm text-slate-600">{contactNumber || "-"}</div>
                  <div className="text-sm text-slate-600">{email || "-"}</div>
                </div>

                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm"
                  aria-label="Call contact"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.3 19.3 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.61a2 2 0 0 1-.45 2.11L8 9.71a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.61.6a2 2 0 0 1 1.72 2Z" />
                  </svg>
                </button>
              </div>
            </div>
          </Card>
        </div>

        <Card bordered className="border-slate-200" styles={{ body: { padding: 0 } }}>
          <div className="px-3 pt-1.5 sm:px-4">
            <div className="mb-1.5 text-sm font-semibold text-slate-900">Files</div>
          </div>

          <div className="px-3 py-1.5 sm:px-4">
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
               <div ref={filesRef} className="flex gap-3 overflow-x-auto scroll-smooth px-7 pb-0.5">
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
                          <div key={file?.uid ?? file?.id ?? `${caption}-${index}`} className="w-[100px] shrink-0">
                            {preview ? (
                              <Image
                                src={preview}
                                alt={caption}
                                width={100}
                                height={100}
                                className="rounded-sm object-cover"
                                preview={{ mask: false }}
                              />
                            ) : (
                              <div className="flex h-[100px] items-center justify-center rounded-sm bg-slate-100 text-xs text-slate-500">
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
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-2xl leading-none text-slate-500 shadow-sm hover:bg-white" >
                  ›
                </button>
              </div>
            ) : (
              <Empty description="No files found" />
            )}
          </div>
        </Card>
      </div>
    </Spin>
  );
};

export default TicketOverviewSection;
