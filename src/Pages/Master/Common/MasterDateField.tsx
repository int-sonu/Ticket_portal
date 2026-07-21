import { CalendarOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";

import CalendarSelectionModal from "../../../ui/CalendarPopup/CalendarSelectionModal";

type MasterDateFieldProps = {
  value?: Dayjs | null;
  onChange?: (value: Dayjs | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

const MasterDateField = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Select date",
}: MasterDateFieldProps) => {
  const selectedValue = dayjs.isDayjs(value) && value.isValid() ? value : null;
  const [open, setOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<Dayjs>(selectedValue ?? dayjs());
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(
    (selectedValue ?? dayjs()).startOf("month"),
  );

  const openCalendar = () => {
    if (disabled) return;
    const nextDate = selectedValue ?? dayjs();
    setPendingDate(nextDate);
    setCalendarMonth(nextDate.startOf("month"));
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openCalendar}
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span>{selectedValue ? selectedValue.format("DD/MM/YYYY") : placeholder}</span>
        <CalendarOutlined className="text-slate-500" />
      </button>

      <CalendarSelectionModal
        open={open}
        title="Select Date"
        month={calendarMonth.toDate()}
        selectedDate={pendingDate.toDate()}
        onMonthChange={(month) => setCalendarMonth(dayjs(month))}
        onYearChange={(year) => setCalendarMonth(dayjs(year))}
        onSelectDate={(date) => setPendingDate(dayjs(date))}
        onApply={() => {
          onChange?.(pendingDate.startOf("day"));
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
};

export default MasterDateField;
