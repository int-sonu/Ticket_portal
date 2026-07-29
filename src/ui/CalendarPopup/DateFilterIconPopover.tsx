import { type ReactNode } from "react";
import CalendarPopup from "./CalendarPopup";

type DateFilterIconPopoverProps = {
  open: boolean;
  iconSrc: string;
  alt?: string;
  ariaLabel: string;
  month: Date;
  selectedDate: Date;
  selectedFromDate?: Date;
  selectedToDate?: Date;
  onOpenToggle: () => void;
  onMonthChange: (nextMonth: Date) => void;
  onYearChange: (nextYear: Date) => void;
  onSelectDate: (date: Date) => void;
  onSelectRangeDate?: (date: Date) => void;
  onApply: () => void;
  onCancel: () => void;
  title?: ReactNode;
  popupClassName?: string;
};

const DateFilterIconPopover = ({
  open,
  iconSrc,
  alt = "",
  ariaLabel,
  month,
  selectedDate,
  selectedFromDate,
  selectedToDate,
  onOpenToggle,
  onMonthChange,
  onYearChange,
  onSelectDate,
  onSelectRangeDate,
  onApply,
  onCancel,
  title,
  popupClassName,
}: DateFilterIconPopoverProps) => {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onOpenToggle}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white p-0 shadow-sm transition-colors hover:bg-slate-50"
      >
        <img src={iconSrc} alt={alt} className="h-5 w-5" aria-hidden="true" />
      </button>

      <CalendarPopup
        open={open}
        title={title}
        month={month}
        selectedDate={selectedDate}
        selectedFromDate={selectedFromDate}
        selectedToDate={selectedToDate}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        onSelectDate={onSelectDate}
        onSelectRangeDate={onSelectRangeDate}
        onApply={onApply}
        onCancel={onCancel}
        className={popupClassName}
      />
    </div>
  );
};

export default DateFilterIconPopover;
