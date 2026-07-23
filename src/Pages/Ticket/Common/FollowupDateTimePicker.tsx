import {
  ClockCircleOutlined,
  LeftOutlined,
  DownOutlined,
  UpOutlined,
  RightOutlined,
} from "@ant-design/icons";
import {
  Input,
  InputNumber,
  Button,
  Popover,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import calenderiCon from "../../../assets/icons/calenderiCon.svg";

dayjs.extend(customParseFormat);

const DISPLAY_FORMAT = "DD/MM/YYYY hh:mm A";
const PARSE_FORMATS = [
  DISPLAY_FORMAT,
  "DD/MM/YYYY HH:mm:ss",
  "DD/MM/YYYY HH:mm",
  "DD/MM/YYYY h:mm A",
  "DD/MM/YYYY hh:mm A",
  "DD/MM/YYYY, HH:mm:ss",
  "DD/MM/YYYY, hh:mm A",
  "YYYY-MM-DD HH:mm:ss",
  "YYYY-MM-DD HH:mm",
  "YYYY-MM-DDTHH:mm:ss",
  "YYYY-MM-DDTHH:mm",
  "YYYY-MM-DD HH:mm",
  "YYYY-MM-DD",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type FollowupDateTimePickerProps = {
  value?: Dayjs | Date | string | null;
  onChange?: (value: Dayjs | null) => void;
  defaultOpen?: boolean;
};

const parseValue = (value?: Dayjs | Date | string | null) => {
  if (!value) return null;

  if (dayjs.isDayjs(value)) return value;
  if (typeof value === "object" && value !== null && value instanceof Date) {
    return dayjs(value);
  }

  if (typeof value === "string") {
    const cleaned = value.trim().replace(/,/g, "");

    for (const format of PARSE_FORMATS) {
      const parsed = dayjs(cleaned, format, true);
      if (parsed.isValid()) return parsed;
    }

    const fallback = dayjs(cleaned);
    if (fallback.isValid()) return fallback;
  }

  return null;
};

const formatDisplayFromRaw = (value?: Dayjs | Date | string | null) => {
  const parsed = parseValue(value);
  if (parsed) return parsed.format(DISPLAY_FORMAT);

  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const dateMatch = raw.match(/\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/);
  if (!dateMatch) return raw;

  const parts = dateMatch[1].replace(/-/g, "/").split("/");
  if (parts.length !== 3) return dateMatch[1];

  const [first, second, third] = parts;
  const day = first.padStart(2, "0");
  const month = second.padStart(2, "0");
  const year = third.length === 2 ? `20${third}` : third;

  return `${day}/${month}/${year}`;
};

const clampMinute = (minute: number) =>
  Math.min(59, Math.max(0, minute));

const FollowupDateTimePicker = ({
  value,
  onChange,
  defaultOpen = false,
}: FollowupDateTimePickerProps) => {
  const selectedValue = useMemo(() => parseValue(value), [value]);
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [timeOpen, setTimeOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<Dayjs | null>(
    selectedValue ?? null
  );
  const [viewDate, setViewDate] = useState<Dayjs>(
    selectedValue ?? dayjs()
  );

  useEffect(() => {
    if (open) {
      setViewDate(selectedValue ?? dayjs());
      setDraftValue(selectedValue ?? null);
      setTimeOpen(true);
    }
  }, [open, selectedValue]);

  useEffect(() => {
    if (defaultOpen) {
      setOpen(true);
      setTimeOpen(true);
    }
  }, [defaultOpen]);

  useEffect(() => {
    if (!open) setTimeOpen(false);
  }, [open]);

  useEffect(() => {
    if (selectedValue) {
      setDraftValue(selectedValue);
      setViewDate(selectedValue);
    }
  }, [selectedValue]);

  const activeValue = selectedValue ?? draftValue ?? dayjs().startOf("day");
  const displayValue = selectedValue ? selectedValue.format(DISPLAY_FORMAT) : "";
  const fallbackDisplayValue = formatDisplayFromRaw(value);
  const visibleValue = displayValue || fallbackDisplayValue;

  const updateValue = (next: Dayjs) => {
    onChange?.(next);
  };

  const handleDayClick = (day: Dayjs) => {
    const next = day
      .hour(activeValue.hour())
      .minute(activeValue.minute())
      .second(0)
      .millisecond(0);

    setViewDate(next);
    setDraftValue(next);
    updateValue(next);
  };

  const handleMonthChange = (delta: number) => {
    setViewDate((current) => current.add(delta, "month"));
  };

  const handleYearChange = (delta: number) => {
    setViewDate((current) => current.add(delta, "year"));
  };

  const hour12 = (() => {
    const hour = activeValue.hour() % 12;
    return hour === 0 ? 12 : hour;
  })();
  const minute = activeValue.minute();
  const meridiem = activeValue.hour() >= 12 ? "PM" : "AM";

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

    const nextValue = base
      .hour(normalizedHour)
      .minute(minuteValue)
      .second(0)
      .millisecond(0);

    setDraftValue(nextValue);
    setViewDate(nextValue);

    updateValue(nextValue);
  };

  const startOfGrid = viewDate
    .startOf("month")
    .subtract(viewDate.startOf("month").day(), "day");

  const days = Array.from({ length: 42 }, (_, index) =>
    startOfGrid.add(index, "day")
  );
  const todayStart = dayjs().startOf("day");

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTimeOpen(false);
        } else {
          setTimeOpen(true);
        }
      }}
      trigger="click"
      placement="bottomLeft"
      getPopupContainer={() => document.body}
      overlayClassName="followup-datetime-popover"
      content={
          <div className="followup-date-picker followup-date-picker--compact">
          <div className="followup-date-picker-header">
            <div className="followup-date-picker-group">
              <button
                type="button"
                className="followup-nav-btn"
                onClick={() => handleYearChange(-1)}
              >
                <LeftOutlined />
              </button>
              <span className="followup-header-value">
                {viewDate.year()}
              </span>
              <button
                type="button"
                className="followup-nav-btn"
                onClick={() => handleYearChange(1)}
              >
                <RightOutlined />
              </button>
            </div>

            <div className="followup-date-picker-group followup-month-group">
              <button
                type="button"
                className="followup-nav-btn"
                onClick={() => handleMonthChange(-1)}
              >
                <LeftOutlined />
              </button>
              <span className="followup-header-value">
                {viewDate.format("MMMM")}
              </span>
              <button
                type="button"
                className="followup-nav-btn"
                onClick={() => handleMonthChange(1)}
              >
                <RightOutlined />
              </button>
            </div>
          </div>

          <div className="followup-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="followup-days-grid">
            {days.map((day) => {
              const isSelected = selectedValue
                ? day.isSame(selectedValue, "day")
                : false;
              const isToday = day.isSame(dayjs(), "day");
              const isPastDay = day.isBefore(todayStart, "day");
              const isDisabled = isPastDay;

              return (
                <button
                  key={day.format("YYYY-MM-DD")}
                  type="button"
                  className={[
                    "followup-day",
                    isDisabled ? "is-disabled" : "",
                    isSelected ? "is-selected" : "",
                    isToday ? "is-today" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (isDisabled) return;
                    handleDayClick(day);
                  }}
                  disabled={isDisabled}
                >
                  <span>{day.date()}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={`followup-time-toggle ${
              timeOpen ? "is-open" : ""
            }`}
            onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              setTimeOpen((current) => !current);
            }}
          >
            <span className="followup-time-toggle-label">
              <ClockCircleOutlined />
              <span>Select Time</span>
            </span>
            {timeOpen ? <DownOutlined /> : <RightOutlined />}
          </button>

          {timeOpen ? (
            <div className="followup-time-panel">
              <div className="followup-time-controls">
                <div className="followup-time-field">
                  <InputNumber
                    min={1}
                    max={12}
                    value={hour12}
                    onChange={(nextHour) =>
                      setTime(
                        typeof nextHour === "number" ? nextHour : null,
                        null,
                        null
                      )
                    }
                    className="followup-time-input followup-hour-input"
                    controls={false}
                  />
                  <div
                    className="followup-time-stepper followup-hour-stepper"
                    aria-hidden="true"
                  >
                    <button
                      type="button"
                      className="followup-time-step followup-time-step-up"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setTime(hour12 + 1, null, null)}
                    >
                      <UpOutlined />
                    </button>
                    <button
                      type="button"
                      className="followup-time-step followup-time-step-down"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setTime(hour12 - 1, null, null)}
                    >
                      <DownOutlined />
                    </button>
                  </div>
                </div>
                <span className="followup-time-dot">•</span>
                <div className="followup-time-field">
                  <InputNumber
                    min={0}
                    max={59}
                    value={minute}
                    formatter={(inputValue) =>
                      String(inputValue ?? "0").padStart(2, "0")
                    }
                    parser={(inputValue) => Number(inputValue || 0)}
                    onChange={(nextMinute) =>
                      setTime(
                        null,
                        typeof nextMinute === "number" ? nextMinute : null,
                        null
                      )
                    }
                    className="followup-time-input followup-minute-input"
                    controls={false}
                  />
                  <div
                    className="followup-time-stepper followup-minute-stepper"
                    aria-hidden="true"
                  >
                    <button
                      type="button"
                      className="followup-time-step followup-time-step-up"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setTime(null, minute + 1, null)}
                    >
                      <UpOutlined />
                    </button>
                    <button
                      type="button"
                      className="followup-time-step followup-time-step-down"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setTime(null, minute - 1, null)}
                    >
                      <DownOutlined />
                    </button>
                  </div>
                </div>
                <div className="followup-meridiem-stack">
                  <button
                    type="button"
                    className={`followup-meridiem-btn ${
                      meridiem === "AM" ? "is-active" : ""
                    }`}
                    onClick={() => setTime(null, null, "AM")}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    className={`followup-meridiem-btn ${
                      meridiem === "PM" ? "is-active" : ""
                    }`}
                    onClick={() => setTime(null, null, "PM")}
                  >
                    PM
                  </button>
                </div>
              </div>

              <div className="followup-time-actions">
                <Button
                  type="primary"
                  className="followup-time-ok-btn"
                  onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event: MouseEvent<HTMLButtonElement>) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setTimeOpen(false);
                    setOpen(false);
                  }}
                >
                  Ok
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      }
    >
      <div
        className="followup-date-trigger"
        onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
          event.preventDefault();
        }}
        onClick={() => {
          setTimeOpen(true);
          setOpen(true);
        }}
      >
        <Input
          readOnly
          value={visibleValue}
          placeholder="Select follow up date & time"
          suffix={<img src={calenderiCon} alt="calendar" />}
          className="followup-date-input pointer-events-none"
        />
          
      </div>
    </Popover>
  );
};

export default FollowupDateTimePicker;
