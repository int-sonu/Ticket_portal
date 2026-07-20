import { Modal } from "antd";
import type { ReactNode } from "react";

import CalendarPopup from "./CalendarPopup";

type CalendarSelectionModalProps = {
  open: boolean;
  title?: ReactNode;
  month: Date;
  selectedDate: Date;
  selectedFromDate?: Date;
  selectedToDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onMonthChange: (nextMonth: Date) => void;
  onYearChange: (nextYear: Date) => void;
  onSelectDate: (date: Date) => void;
  onApply: () => void;
  onCancel: () => void;
};

const CalendarSelectionModal = ({
  open,
  title = "Select Date",
  month,
  selectedDate,
  selectedFromDate,
  selectedToDate,
  minDate,
  maxDate,
  onMonthChange,
  onYearChange,
  onSelectDate,
  onApply,
  onCancel,
}: CalendarSelectionModalProps) => {
  return (
    <Modal
      open={open}
      title={title}
      footer={null}
      onCancel={onCancel}
      centered
      destroyOnClose
      width={372}
      closable={false}
      maskClosable={false}
      styles={{
        body: { padding: 0 },
      }}
    >
      <CalendarPopup
        open={open}
        inline
        title=""
        month={month}
        selectedDate={selectedDate}
        selectedFromDate={selectedFromDate}
        selectedToDate={selectedToDate}
        minDate={minDate}
        maxDate={maxDate}
        onMonthChange={onMonthChange}
        onYearChange={onYearChange}
        onSelectDate={onSelectDate}
        onApply={onApply}
        onCancel={onCancel}
        className="border-none shadow-none"
      />
    </Modal>
  );
};

export default CalendarSelectionModal;
