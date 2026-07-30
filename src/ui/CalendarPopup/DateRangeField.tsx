import dayjs, { type Dayjs } from "dayjs";

import DashboardDateRangePicker from "../../Components/Dashboard/DashboardDatePicker/DashboardDateRangePicker";

type DateRangeValue = [Dayjs | null, Dayjs | null];

type DateRangeFieldProps = {
  value?: DateRangeValue;
  onChange?: (value: [Dayjs, Dayjs]) => void;
};

const DateRangeField = ({ value, onChange }: DateRangeFieldProps) => {
  const start = value?.[0];
  const end = value?.[1];
  const fallback = dayjs().startOf("day");

  return (
    <DashboardDateRangePicker
      value={{
        start: dayjs.isDayjs(start) && start.isValid() ? start : fallback,
        end: dayjs.isDayjs(end) && end.isValid() ? end : fallback,
      }}
      onChange={(range) => onChange?.([range.start, range.end])}
    />
  );
};

export default DateRangeField;
