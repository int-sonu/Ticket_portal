import { useEffect, useRef, useState, type ReactNode } from "react";

type CalendarCell = {
  day: number;
  currentMonth: boolean;
};
const FIRST_YEAR = 1976;
const LAST_YEAR = new Date().getFullYear() + 100;

type CalendarPopupProps = {
  open: boolean;
  month: Date;
  selectedDate: Date;
  selectedFromDate?: Date;
  selectedToDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  hideOutsideMonthDates?: boolean;
  hideOutsideRangeDates?: boolean;
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

  // Keep a consistent six-week calendar so the popup never collapses or
  // leaves an oversized empty section in shorter months.
  const totalCells = 42;
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

const isSameOrAfter = (left: Date, right: Date) => left.getTime() >= right.getTime();
const isSameOrBefore = (left: Date, right: Date) => left.getTime() <= right.getTime();

const CalendarPopup = ({
  open,
  month,
  selectedDate,
  selectedFromDate,
  selectedToDate,
  minDate,
  maxDate,
  hideOutsideMonthDates = false,
  hideOutsideRangeDates = false,
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
  const [pickerView, setPickerView] = useState<"days" | "years" | "months">("days");
  const yearListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pickerView === "years") {
      yearListRef.current
        ?.querySelector<HTMLElement>('[data-selected-year="true"]')
        ?.scrollIntoView({ block: "center" });
    }
  }, [pickerView]);

  if (!open) {
    return null;
  }

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const normalizedSelectedDate = normalizeDate(selectedDate);
  const normalizedRangeStart = selectedFromDate ? normalizeDate(selectedFromDate) : null;
  const normalizedRangeEnd = selectedToDate ? normalizeDate(selectedToDate) : null;
  const normalizedMinDate = minDate ? normalizeDate(minDate) : null;
  const normalizedMaxDate = maxDate ? normalizeDate(maxDate) : null;
  const displayMonth = month;
  const calendarDays = buildCalendarGrid(displayMonth);
  const showTitle = title !== null && title !== undefined && String(title).trim() !== "";

  const isWithinAllowedRange = (candidate: Date) => {
    if (normalizedMinDate && !isSameOrAfter(candidate, normalizedMinDate)) {
      return false;
    }

    if (normalizedMaxDate && !isSameOrBefore(candidate, normalizedMaxDate)) {
      return false;
    }

    return true;
  };

  const isInRange = (day: number, currentMonth: boolean) => {
    if (!currentMonth || !normalizedRangeStart || !normalizedRangeEnd) return false;

    const candidate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
    const startTime = normalizedRangeStart.getTime();
    const endTime = normalizedRangeEnd.getTime();
    const candidateTime = candidate.getTime();
    const minTime = Math.min(startTime, endTime);
    const maxTime = Math.max(startTime, endTime);

    return candidateTime >= minTime && candidateTime <= maxTime;
  };

  const isSelectedDay = (day: number, currentMonth: boolean) =>
    currentMonth &&
    (normalizedRangeStart || normalizedRangeEnd
      ? [normalizedRangeStart, normalizedRangeEnd]
      : [normalizedSelectedDate])
      .filter((date): date is Date => Boolean(date))
      .some(
        (date) =>
          date.getDate() === day &&
          date.getMonth() === displayMonth.getMonth() &&
          date.getFullYear() === displayMonth.getFullYear(),
      );

  const isToday = (day: number, currentMonth: boolean) => {
    const today = new Date();

    return (
      currentMonth &&
      today.getDate() === day &&
      today.getMonth() === displayMonth.getMonth() &&
      today.getFullYear() === displayMonth.getFullYear()
    );
  };

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + offset, 1);
    if (nextMonth.getFullYear() < FIRST_YEAR || nextMonth.getFullYear() > LAST_YEAR) return;
    onMonthChange(nextMonth);
  };

  const moveYear = (offset: number) => {
    const nextMonth = new Date(displayMonth.getFullYear() + offset, displayMonth.getMonth(), 1);
    if (nextMonth.getFullYear() < FIRST_YEAR || nextMonth.getFullYear() > LAST_YEAR) return;
    onYearChange(nextMonth);
  };

  return (
    <div
      className={`z-50 rounded-2xl border gap-5 border-slate-100 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ${
        inline ? "static w-full shadow-none" : "absolute right-0 top-0 mt-12 w-[300px] "
      } ${className}`.trim()}
    >
      {showTitle ? <div className="mb-3 text-sm font-semibold text-slate-800">{title}</div> : null}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => moveYear(-1)}
            disabled={displayMonth.getFullYear() <= FIRST_YEAR}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => setPickerView((view) => view === "years" ? "days" : "years")}
            className="w-10 cursor-pointer text-center text-[13px] font-bold text-slate-700 hover:text-sky-500"
          >
            {displayMonth.getFullYear()}
          </button>
          <button
            onClick={() => moveYear(1)}
            disabled={displayMonth.getFullYear() >= LAST_YEAR}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            &gt;
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => moveMonth(-1)}
            disabled={displayMonth.getFullYear() <= FIRST_YEAR && displayMonth.getMonth() === 0}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => setPickerView((view) => view === "months" ? "days" : "months")}
            className="w-16 cursor-pointer text-center text-[13px] font-bold text-slate-700 hover:text-sky-500"
          >
            {displayMonth.toLocaleString("en-US", { month: "long" })}
          </button>
          <button
            onClick={() => moveMonth(1)}
            disabled={displayMonth.getFullYear() >= LAST_YEAR && displayMonth.getMonth() === 11}
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 text-xs font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="relative flex min-h-[265px] flex-col">
        {pickerView === "years" ? (
          <div ref={yearListRef} className="absolute inset-y-0 left-0 z-10 w-[145px] overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg">
            {Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index).map((year) => (
              <button
                key={year}
                type="button"
                data-selected-year={year === displayMonth.getFullYear()}
                onClick={() => {
                  onYearChange(new Date(year, displayMonth.getMonth(), 1));
                  setPickerView("days");
                }}
                className={`mb-1 block w-full rounded border px-2 py-1.5 text-sm ${
                  year === displayMonth.getFullYear()
                    ? "border-sky-400 bg-sky-50 text-sky-600"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        ) : null}

        {pickerView === "months" ? (
          <div className="absolute inset-x-0 top-0 z-10 grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
            {Array.from({ length: 12 }, (_, monthIndex) => (
              <button
                key={monthIndex}
                type="button"
                onClick={() => {
                  onMonthChange(new Date(displayMonth.getFullYear(), monthIndex, 1));
                  setPickerView("days");
                }}
                className={`rounded border py-1.5 text-sm ${
                  monthIndex === displayMonth.getMonth()
                    ? "border-sky-500 bg-sky-500 text-white"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {new Date(2000, monthIndex, 1).toLocaleString("en-US", { month: "short" })}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mb-2 grid grid-cols-7 border-b border-slate-200 pb-2 border-t pt-2 text-center text-sm font-semibold text-gray-900">
          {weekDays.map((weekDay) => (
            <div key={weekDay} className="flex h-6 items-center justify-center">
              {weekDay}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-3">
          {calendarDays.map(({ day, currentMonth }, index) => {
            const selected = isSelectedDay(day, currentMonth);
            const activeToday = isToday(day, currentMonth);
            const candidate = currentMonth
              ? new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day)
              : null;
            const inAllowedRange = candidate ? isWithinAllowedRange(candidate) : false;

            if ((!currentMonth && hideOutsideMonthDates) || (currentMonth && hideOutsideRangeDates && !inAllowedRange)) {
              return <div key={`${day}-${currentMonth}-${index}`} className="h-8 w-8" />;
            }

            return (
              <button
                key={`${day}-${currentMonth}-${index}`}
                onClick={() => {
                  if (!currentMonth || !inAllowedRange) return;
                  const nextDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), day);
                  if (onSelectRangeDate) {
                    onSelectRangeDate(nextDate);
                    return;
                  }
                  onSelectDate(nextDate);
                }}
                type="button"
                disabled={!currentMonth || !inAllowedRange}
                className={`mx-auto flex h-9 w-9 items-center justify-center text-xs font-medium transition-colors
                  ${
                    selected
                      ? "rounded-full bg-[#2cd5a9] font-bold text-white"
                      : isInRange(day, currentMonth)
                        ? "bg-blue-100 text-slate-800"
                      : currentMonth
                        ? activeToday
                          ? "border border-[#2cd5a9] text-[#2cd5a9]"
                          : inAllowedRange
                            ? "text-slate-800 hover:bg-slate-100"
                            : "cursor-not-allowed text-slate-300"
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
        <div className="mt-2 flex items-center justify-end gap-4 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#2cd5a9] px-5 py-1.5 text-[13px] font-semibold text-[#2cd5a9] transition-colors hover:bg-teal-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-[#2cd5a9] px-6 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#25bfa4]"
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default CalendarPopup;
