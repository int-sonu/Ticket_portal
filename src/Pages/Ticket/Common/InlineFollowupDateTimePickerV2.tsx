import {
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button, InputNumber } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useMemo, useState } from "react";

dayjs.extend(customParseFormat);

const DISPLAY_FORMAT = "DD/MM/YYYY hh:mm A";
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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
    setViewDate((current) => current.add(delta, "month"));
  };

  const handleYearChange = (delta: number) => {
    setViewDate((current) => current.add(delta, "year"));
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

  const startOfGrid = viewDate
    .startOf("month")
    .subtract(viewDate.startOf("month").day(), "day");

  const days = Array.from({ length: 42 }, (_, index) =>
    startOfGrid.add(index, "day")
  );

  return (
    <div className="grid grid-cols-[340px_285px] items-start gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <button type="button" className="followup-nav-btn" onClick={() => handleYearChange(-1)}>
              <LeftOutlined />
            </button>
            <span className="font-semibold text-slate-800">{viewDate.year()}</span>
            <button type="button" className="followup-nav-btn" onClick={() => handleYearChange(1)}>
              <RightOutlined />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="followup-nav-btn" onClick={() => handleMonthChange(-1)}>
              <LeftOutlined />
            </button>
            <span className="font-semibold text-slate-800">{viewDate.format("MMMM")}</span>
            <button type="button" className="followup-nav-btn" onClick={() => handleMonthChange(1)}>
              <RightOutlined />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = selectedValue ? day.isSame(selectedValue, "day") : false;
            const isToday = day.isSame(dayjs(), "day");

            return (
              <button
                key={day.format("YYYY-MM-DD")}
                type="button"
                className={[
                  "h-9 rounded-md text-sm transition",
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100",
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

      <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-3">
        <div className="text-sm font-medium text-slate-700">Select Time</div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <InputNumber
              min={1}
              max={12}
              value={hour12}
              onChange={(nextHour) =>
                setTime(typeof nextHour === "number" ? nextHour : null, null, null)
              }
              controls={false}
              className="h-24 w-24 rounded-lg border border-blue-400 bg-blue-500 text-center text-4xl font-semibold text-white shadow-sm"
            />
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col text-white/90">
              <UpOutlined />
              <DownOutlined />
            </div>
          </div>

          <span className="px-1 text-2xl font-medium text-slate-300">:</span>

          <div className="relative">
            <InputNumber
              min={0}
              max={59}
              value={minute}
              formatter={(inputValue) => String(inputValue ?? "0").padStart(2, "0")}
              parser={(inputValue) => Number(inputValue || 0)}
              onChange={(nextMinute) =>
                setTime(null, typeof nextMinute === "number" ? nextMinute : null, null)
              }
              controls={false}
              className="h-24 w-24 rounded-lg border border-blue-400 bg-blue-500 text-center text-4xl font-semibold text-white shadow-sm"
            />
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col text-white/90">
              <UpOutlined />
              <DownOutlined />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              size="small"
              className={
                meridiem === "AM"
                  ? "!border-blue-500 !bg-blue-500 !text-white"
                  : "!border-blue-500 !bg-white !text-blue-500"
              }
              onClick={() => setTime(null, null, "AM")}
            >
              AM
            </Button>
            <Button
              size="small"
              className={
                meridiem === "PM"
                  ? "!border-blue-500 !bg-blue-500 !text-white"
                  : "!border-blue-500 !bg-white !text-blue-500"
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
