import { CalendarOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";

export const ReportDateRangeFields = ({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: Dayjs;
  to: Dayjs;
  onFrom: () => void;
  onTo: () => void;
}) => (
  <>
    <h3 className="mb-3 text-sm font-medium text-slate-800">Date</h3>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={onFrom} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm">
        <span>From {from.format("DD/MM/YYYY")}</span>
        <CalendarOutlined className="text-slate-500" />
      </button>
      <button type="button" onClick={onTo} className="flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm">
        <span>To {to.format("DD/MM/YYYY")}</span>
        <CalendarOutlined className="text-slate-500" />
      </button>
    </div>
  </>
);




