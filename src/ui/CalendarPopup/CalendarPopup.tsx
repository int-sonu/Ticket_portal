import { type ReactNode } from "react";

type CalendarCell = {
  day: number;
  currentMonth: boolean;
};

type CalendarPopupProps = {
  open: boolean;
  month: Date;
  selectedDate: Date;
  selectedFromDate?: Date;
  selectedToDate?: Date;
  title?: ReactNode;
  inline?: boolean;
  className?: string;
  showActions?: boolean;
  onMonthChange: (nextMonth: Date) => void;
  onYearChange: (nextYear: Date) => void;
  onSelectDate: (date: Date) => void;
  onSelectRangeDate?: (date: Date) => void;
  onApply: () => void;
  onCancel: () => void;
};

const buildCalendarGrid = (monthValue: Date) => {
  const start = new Date(monthValue.getFullYear(), monthValue.getMonth(), 1);
  const startDayOfWeek = start.getDay();
  const totalDays = new Date(
    monthValue.getFullYear(),
    monthValue.getMonth() + 1,
    0,
  ).getDate();
  const prevMonthDays = new Date(
    monthValue.getFullYear(),
    monthValue.getMonth(),
    0,
  ).getDate();

  const daysGrid: CalendarCell[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthDays - i,
      currentMonth: false,
    });
  }

  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      day: i,
      currentMonth: true,
    });
  }

  const totalCells = daysGrid.length > 35 ? 42 : 35;
  const nextDaysCount = totalCells - daysGrid.length;

  for (let i = 1; i <= nextDaysCount; i++) {
    daysGrid.push({
      day: i,
      currentMonth: false,
    });
  }

  return daysGrid;
};

const normalizeDate = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const CalendarPopup = ({
  open,
  month,
  selectedDate,
  selectedFromDate,
  selectedToDate,
  title = "Filter",
  inline = false,
  className = "",
  showActions = true,
  onMonthChange,
  onYearChange,
  onSelectDate,
  onSelectRangeDate,
  onApply,
  onCancel,
}: CalendarPopupProps) => {
  if (!open) {
    return null;
  }

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const calendarDays = buildCalendarGrid(month);
  const normalizedSelectedDate = normalizeDate(selectedDate);
  const normalizedRangeStart = selectedFromDate ? normalizeDate(selectedFromDate) : null;
  const normalizedRangeEnd = selectedToDate ? normalizeDate(selectedToDate) : null;

  const isInRange = (day: number, currentMonth: boolean) => {
    if (!currentMonth || !normalizedRangeStart || !normalizedRangeEnd) return false;

    const candidate = new Date(month.getFullYear(), month.getMonth(), day);
    const startTime = normalizedRangeStart.getTime();
    const endTime = normalizedRangeEnd.getTime();
    const candidateTime = candidate.getTime();
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);

    return candidateTime >= minTime && candidateTime <= maxTime;
  };

  const isSelectedDay = (day: number, currentMonth: boolean) =>
    currentMonth &&
    normalizedSelectedDate.getDate() === day &&
    normalizedSelectedDate.getMonth() === month.getMonth() &&
    normalizedSelectedDate.getFullYear() === month.getFullYear();

  const isToday = (day: number, currentMonth: boolean) => {
    const today = new Date();

    return (
      currentMonth &&
      today.getDate() === day &&
      today.getMonth() === month.getMonth() &&
      today.getFullYear() === month.getFullYear()
    );
  };

  return (
    <div
      className={`z-50 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ${
        inline ? "static w-full shadow-none" : "absolute right-0 top-0 mt-12 w-[340px]"
      } ${className}`.trim()}
    >
      <div className="mb-3 text-sm font-semibold text-slate-800">{title}</div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(new Date(month.getFullYear() - 1, month.getMonth(), 1))}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            &lt;
          </button>
          <span className="w-10 text-center text-[13px] font-bold text-slate-700">
            {month.getFullYear()}
          </span>
          <button
            onClick={() => onYearChange(new Date(month.getFullYear() + 1, month.getMonth(), 1))}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            &gt;
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            &lt;
          </button>
          <span className="w-16 text-center text-[13px] font-bold text-slate-700">
            {month.toLocaleString("en-US", { month: "long" })}
          </span>
          <button
            onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-600">
          {weekDays.map((weekDay) => (
            <div key={weekDay} className="flex h-6 items-center justify-center">
              {weekDay}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map(({ day, currentMonth }, index) => {
            const selected = isSelectedDay(day, currentMonth);
            const activeToday = isToday(day, currentMonth);

            return (
              <button
                key={`${day}-${currentMonth}-${index}`}
                onClick={() => {
                  if (!currentMonth) return;
                  const nextDate = new Date(month.getFullYear(), month.getMonth(), day);
                  if (onSelectRangeDate) {
                    onSelectRangeDate(nextDate);
                    return;
                  }
                  onSelectDate(nextDate);
                }}
                type="button"
                disabled={!currentMonth}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors
                  ${
                    selected
                      ? "bg-[#2cd5a9] font-bold text-white"
                      : isInRange(day, currentMonth)
                        ? "bg-teal-50 text-slate-800"
                      : currentMonth
                        ? activeToday
                          ? "border border-[#2cd5a9] text-[#2cd5a9]"
                          : "text-slate-800 hover:bg-slate-100"
                        : "cursor-not-allowed text-slate-300"
                  }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {showActions ? (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#2cd5a9] px-4 py-1.5 text-[13px] font-semibold text-[#2cd5a9] transition-colors hover:bg-teal-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-[#2cd5a9] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#25bfa4]"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default CalendarPopup;
