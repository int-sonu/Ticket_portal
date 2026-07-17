import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

import TicketCalendar from "../../ui/CalendarPopup/TicketCalendar";

type CarouselItem = {
  label: string;
  id: number;
};

type GroupItem = {
  nGroupId?: string | number;
  GroupId?: string | number;
  cGroupName?: string;
  GroupName?: string;
  groupName?: string;
};

type FilterListProps = {
  CarouselItems: CarouselItem[];
  groupList: GroupItem[];
  onClose: VoidFunction;
  handleApplyFilter: (filter: { ticket: number | null; group: string | null; startDate?: string; endDate?: string }) => void;
  selectedFilter: { ticket: number | null; group: string | null };
  setSelectedFilter: (filter: { ticket: number | null; group: string | null }) => void;
  startDate: dayjs.Dayjs;
  endDate: dayjs.Dayjs;
  setStartDate: (nextDate: dayjs.Dayjs) => void;
  setEndDate: (nextDate: dayjs.Dayjs) => void;
};

const FilterList = ({
  CarouselItems,
  groupList,
  onClose,
  handleApplyFilter,
  selectedFilter,
  setSelectedFilter,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: FilterListProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [selectingStart, setSelectingStart] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleSelectTicket = (ticket: number) => {
    setSelectedFilter({ ...selectedFilter, ticket });
  };

  const handleSelectGroup = (group: string) => {
    setSelectedFilter({ ...selectedFilter, group });
  };

  const handleSelectRangeDate = (date: Date) => {
    const picked = dayjs(date);
    if (selectingStart) {
      setStartDate(picked);
      setEndDate(picked);
      setSelectingStart(false);
      return;
    }

    if (picked.isBefore(startDate, "day")) {
      setEndDate(startDate);
      setStartDate(picked);
    } else {
      setEndDate(picked);
    }

    setSelectingStart(true);
  };

  const handleCancel = () => {
    setSelectedFilter({ ticket: null, group: null });
    setSelectingStart(true);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-12 z-50 flex max-h-[79vh] w-[350px] flex-col overflow-hidden  border border-[#EDEDED] bg-white shadow-[0_12px_36px_rgba(0,0,0,0.12)]"
    >
      <div className="bg-[#BFE4F8] px-3 py-4 text-[16px] font-semibold text-[#090909]">
        Filter
      </div>

      <div className="px-4 py-2 h-[90px] overflow-y-auto">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Ticket Type
        </div>
        {CarouselItems.map((item) => {
          const active = selectedFilter.ticket === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTicket(item.id)}
              className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                active ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  active ? "border-sky-500 bg-white" : "border-slate-300 bg-white"
                }`}
              >
                {active ? <span className="h-2 w-2 rounded-full bg-sky-500" /> : null}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="my-2 border border-[#F0F0F0]" />

      <div className="px-4 py-2 h-[90px] overflow-y-auto">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Group
        </div>
        {groupList.map((item) => {
          const groupId = String(item.nGroupId ?? item.GroupId ?? "");
          const groupName = String(item.cGroupName ?? item.GroupName ?? item.groupName ?? "");
          const active = selectedFilter.group === groupId;

          if (!groupId) return null;

          return (
            <button
              key={groupId}
              type="button"
              onClick={() => handleSelectGroup(groupId)}
              className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                active ? "bg-sky-50 text-sky-700" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  active ? "border-sky-500 bg-white" : "border-slate-300 bg-white"
                }`}
              >
                {active ? <span className="h-2 w-2 rounded-full bg-sky-500" /> : null}
              </span>
              <span>{groupName}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 border-t border-[#F0F0F0] px-3 pb-2 pt-3">
        <div className="h-[180px] overflow-y-auto">
        <TicketCalendar
          open
          inline
          title={null}
          showActions={false}
          month={startDate.toDate()}
          selectedDate={endDate.toDate()}
          selectedFromDate={startDate.toDate()}
          selectedToDate={endDate.toDate()}
          onMonthChange={(nextMonth) => setStartDate(dayjs(nextMonth))}
          onYearChange={(nextYear) => setStartDate(dayjs(nextYear))}
          onSelectDate={(date) => {
            setStartDate(dayjs(date));
            setEndDate(dayjs(date));
          }}
          onSelectRangeDate={handleSelectRangeDate}
          onApply={() =>
            handleApplyFilter({
              ...selectedFilter,
              startDate: startDate.format("YYYY-MM-DD"),
              endDate: endDate.format("YYYY-MM-DD"),
            })
          }
          onCancel={handleCancel}
          className="border-0 p-0 shadow-none"
        />
        </div>
      </div>

      <div className="absolute bottom-3 right-3 flex gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-[#2cd5a9] px-4 py-1.5 text-[13px] font-semibold text-[#2cd5a9] transition-colors hover:bg-teal-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            handleApplyFilter({
              ...selectedFilter,
              startDate: startDate.format("YYYY-MM-DD"),
              endDate: endDate.format("YYYY-MM-DD"),
            })
          }
          className="rounded-lg bg-[#2cd5a9] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#25bfa4]"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default FilterList;
