import {
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useMemo, useState } from "react";

dayjs.extend(customParseFormat);
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const FIRST_YEAR = 1976;
const LAST_YEAR = dayjs().year() + 100;

type Props = {
  value?: Dayjs | string | null;
  onChange?: (value: Dayjs | null) => void;
};

const parseValue = (value?: Dayjs | string | null) => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  if (value instanceof Date) return dayjs(value);
  if (typeof value === "string") {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }
  return null;
};

const clampMinute = (minute: number) => Math.min(59, Math.max(0, minute));

const InlineFollowupDateTimePickerV2 = ({ value, onChange }: Props) => {
  const selectedValue = useMemo(() => parseValue(value), [value]);
  const [draftValue, setDraftValue] = useState<Dayjs | null>(selectedValue);
  const [viewDate, setViewDate] = useState<Dayjs>(selectedValue ?? dayjs());
  const [pickerView, setPickerView] = useState<"days" | "years" | "months">("days");

  useEffect(() => {
    setDraftValue(selectedValue ?? null);
    setViewDate(selectedValue ?? dayjs());
  }, [selectedValue]);

  const activeValue = selectedValue ?? draftValue ?? dayjs().startOf("day");
  const hour12 = (() => {
    const hour = activeValue.hour() % 12;
    return hour === 0 ? 12 : hour;
  })();
  const minute = activeValue.minute();
  const meridiem = activeValue.hour() >= 12 ? "PM" : "AM";

  const updateValue = (next: Dayjs) => {
    setDraftValue(next);
    setViewDate(next);
    onChange?.(next);
  };

  const handleDayClick = (day: Dayjs) => {
    const next = day
      .hour(activeValue.hour())
      .minute(activeValue.minute())
      .second(0)
      .millisecond(0);
    updateValue(next);
  };

  const handleMonthChange = (delta: number) => {
    setViewDate((current) => {
      const next = current.add(delta, "month");
      return next.year() < FIRST_YEAR || next.year() > LAST_YEAR ? current : next;
    });
  };

  const handleYearChange = (delta: number) => {
    setViewDate((current) => {
      const next = current.add(delta, "year");
      return next.year() < FIRST_YEAR || next.year() > LAST_YEAR ? current : next;
    });
  };

  const setTime = (
    nextHour12: number | null,
    nextMinute: number | null,
    nextMeridiem: "AM" | "PM" | null
  ) => {
    const base = selectedValue ?? draftValue ?? dayjs().startOf("day");
    const hourValue = nextHour12 ?? hour12;
    const minuteValue = clampMinute(nextMinute ?? minute);
    const meridiemValue = nextMeridiem ?? meridiem;

    let normalizedHour = hourValue % 12;
    if (meridiemValue === "PM") normalizedHour += 12;
    if (meridiemValue === "AM" && hourValue === 12) normalizedHour = 0;

    updateValue(
      base.hour(normalizedHour).minute(minuteValue).second(0).millisecond(0)
    );
  };

  const stepHour = (delta: number) => {
    const next = ((hour12 - 1 + delta + 12) % 12) + 1;
    setTime(next, null, null);
  };

  const stepMinute = (delta: number) => {
    const next = clampMinute(minute + delta);
    setTime(null, next, null);
  };

  const startOfGrid = viewDate
    .startOf("month")
    .subtract(viewDate.startOf("month").day(), "day");

  const days = Array.from({ length: 42 }, (_, index) =>
    startOfGrid.add(index, "day")
  );

  return (
    <div className="mr-9 grid grid-cols-[337px_285px] items-start gap-4">
      <div className="h-[304px] rounded-xl bg-white  p-0">
        <div className="flex items-center justify-between px-1 pb-2 pt-1">
          <div className="flex items-center gap-2">
            <button type="button" className="followup-nav-btn" onClick={() => handleYearChange(-1)}>
              <LeftOutlined />
            </button>
            <button type="button" className="font-semibold text-slate-800 hover:text-sky-500" onClick={() => setPickerView((view) => view === "years" ? "days" : "years")}>
              {viewDate.year()}
            </button>
            <button type="button" className="followup-nav-btn" onClick={() => handleYearChange(1)}>
              <RightOutlined />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="followup-nav-btn" onClick={() => handleMonthChange(-1)}>
              <LeftOutlined />
            </button>
            <button type="button" className="font-semibold text-slate-800 hover:text-sky-500" onClick={() => setPickerView((view) => view === "months" ? "days" : "months")}>
              {viewDate.format("MMMM")}
            </button>
            <button type="button" className="followup-nav-btn" onClick={() => handleMonthChange(1)}>
              <RightOutlined />
            </button>
          </div>
        </div>

        <div className="relative">
          {pickerView === "years" ? (
            <div className="absolute left-0 top-0 z-10 h-[255px] w-[145px] overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg">
              {Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index).map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => {
                    setViewDate((date) => date.year(year));
                    setPickerView("days");
                  }}
                  className={`mb-1 block w-full rounded border px-2 py-1.5 text-sm ${
                    year === viewDate.year() ? "border-sky-400 bg-sky-50 text-sky-600" : "border-slate-200 text-slate-700"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          ) : null}
          {pickerView === "months" ? (
            <div className="absolute inset-x-0 top-0 z-10 grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
              {Array.from({ length: 12 }, (_, month) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => {
                    setViewDate((date) => date.month(month));
                    setPickerView("days");
                  }}
                  className={`rounded border py-1.5 text-sm ${
                    month === viewDate.month() ? "border-sky-500 bg-sky-500 text-white" : "border-slate-200 text-slate-700"
                  }`}
                >
                  {dayjs().month(month).format("MMM")}
                </button>
              ))}
            </div>
          ) : null}
        <div className="mt-2.5 grid grid-cols-7 gap-1 px-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-1.5 grid grid-cols-7 gap-1 px-1">
          {days.map((day) => {
            const isSelected = selectedValue ? day.isSame(selectedValue, "day") : false;
            const isToday = day.isSame(dayjs(), "day");

            return (
              <button
                key={day.format("YYYY-MM-DD")}
                type="button"
                className={[
                  "h-9 rounded-md text-sm transition ",
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100",
                  isToday && !isSelected ? "ring-1 ring-blue-400" : "",
                ].join(" ")}
                onClick={() => handleDayClick(day)}
              >
                {day.date()}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      <div className="h-[134px]  rounded-xl bg-white p-3 ">
        <div className="text-sm font-medium text-slate-700">Select Time</div>
        <div className="mt-3 flex items-start gap-2">
          <div className="relative h-[82px] w-[95px] overflow-hidden rounded-lg bg-sky-500/80 ">
            <button
              type="button"
              className="absolute left-0 top-0 flex h-5 w-full items-center justify-center text-white/90"
              onClick={() => stepHour(1)}
            >
              <UpOutlined />
            </button>
            <button
              type="button"
              className="absolute left-0 bottom-0 flex h-5 w-full items-center justify-center text-white/90"
              onClick={() => stepHour(-1)}
            >
              <DownOutlined />
            </button>
            <div className="flex h-full items-center justify-center px-3 text-[31px] font-semibold text-white">
              {hour12}
            </div>
          </div>

          <span className="px-1 text-2xl font-medium text-slate-300">:</span>

          <div className="relative h-[82px] w-[95px] overflow-hidden rounded-lg bg-sky-500/80 shadow-sm">
            <button
              type="button"
              className="absolute left-0 top-0 flex h-5 w-full items-center justify-center text-white/90"
              onClick={() => stepMinute(1)}
            >
              <UpOutlined />
            </button>
            <button
              type="button"
              className="absolute left-0 bottom-0 flex h-5 w-full items-center justify-center text-white/90"
              onClick={() => stepMinute(-1)}
            >
              <DownOutlined />
            </button>
            <div className="flex h-full items-center justify-center px-3 text-[31px] font-semibold text-white">
              {String(minute).padStart(2, "0")}
            </div>
          </div>

          <div className="flex flex-col gap-1 self-start pt-1">
            <Button
              size="small"
              className={
                meridiem === "AM"
                  ? "!border-sky-500/80 !bg-sky-500/80 !text-white"
                  : "!border-sky-500/80 !bg-white !text-sky-500/80"
              }
              onClick={() => setTime(null, null, "AM")}
            >
              AM
            </Button>
            <Button
              size="small"
              className={
                meridiem === "PM"
                  ? "!border-sky-500/80 !bg-sky-500/80 !text-white"
                  : "!border-sky-500/80 !bg-white !text-sky-500/80"
              }
              onClick={() => setTime(null, null, "PM")}
            >
              PM
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineFollowupDateTimePickerV2;
