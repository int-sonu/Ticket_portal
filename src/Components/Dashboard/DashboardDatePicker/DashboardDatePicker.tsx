import React, { useState, useEffect, useRef } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import calendarIcon from '../../../assets/icons/calenderiCon.svg';

interface DashboardDatePickerProps {
  value: Dayjs;
  onChange: (date: Dayjs) => void;
}

const DashboardDatePicker: React.FC<DashboardDatePickerProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Dayjs>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update tempDate when value prop changes
  useEffect(() => {
    setTempDate(value);
  }, [value]);

  const handlePreset = (type: 'today' | 'week' | 'month' | 'year') => {
    let target = dayjs();
    if (type === 'week') {
      target = dayjs().add(1, 'week');
    } else if (type === 'month') {
      target = dayjs().add(1, 'month');
    } else if (type === 'year') {
      target = dayjs().add(1, 'year');
    }
    setTempDate(target);
  };

  const handlePrevYear = () => {
    setTempDate(tempDate.subtract(1, 'year'));
  };

  const handleNextYear = () => {
    setTempDate(tempDate.add(1, 'year'));
  };

  const handlePrevMonth = () => {
    setTempDate(tempDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setTempDate(tempDate.add(1, 'month'));
  };

  const handleDateSelect = (day: number, isCurrentMonth: boolean) => {
    let target = tempDate;
    if (isCurrentMonth) {
      target = tempDate.date(day);
    } else {
      // If it's prev/next month day, navigate to that month and select the day
      if (day > 20) {
        // Previous month day
        target = tempDate.subtract(1, 'month').date(day);
      } else {
        // Next month day
        target = tempDate.add(1, 'month').date(day);
      }
    }
    setTempDate(target);
  };

  const handleCancel = () => {
    setTempDate(value);
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  // Calendar Grid Generation
  const startOfMonth = tempDate.startOf('month');
  const startDayOfWeek = startOfMonth.day(); // 0 (Sun) to 6 (Sat)
  const totalDays = tempDate.daysInMonth();

  const prevMonthDays = tempDate.subtract(1, 'month').daysInMonth();

  const daysGrid: { day: number; currentMonth: boolean }[] = [];

  // 1. Previous month padded days
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    daysGrid.push({
      day: prevMonthDays - i,
      currentMonth: false,
    });
  }

  // 2. Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysGrid.push({
      day: i,
      currentMonth: true,
    });
  }

  // 3. Next month padded days to fill the grid (usually 42 cells)
  const totalCells = daysGrid.length > 35 ? 42 : 35; // clean 5 or 6 row layout
  const nextDaysCount = totalCells - daysGrid.length;
  for (let i = 1; i <= nextDaysCount; i++) {
    daysGrid.push({
      day: i,
      currentMonth: false,
    });
  }

  const isSelected = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return false;
    return tempDate.date() === day;
  };

  const isToday = (day: number, currentMonth: boolean) => {
    const today = dayjs();
    return (
      currentMonth &&
      today.date() === day &&
      today.month() === tempDate.month() &&
      today.year() === tempDate.year()
    );
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative font-sans text-sm" ref={containerRef}>
      {/* Date Trigger Input */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-lg border border-sky-200 bg-white px-3.5 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-sky-300 hover:bg-slate-50 cursor-pointer"
        type="button"
      >
        <img
          src={calendarIcon}
          alt=""
          className="h-[18px] w-[18px] shrink-0"
        />
        <span className="text-sm font-semibold tracking-wide text-slate-600">
          {value.format('DD/MM/YYYY')}
        </span>
      </button>

      {/* Dropdown Calendar Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[9999] mt-2.5 w-[330px] rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Presets Grid */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handlePreset('today')}
              type="button"
              className="py-1.5 rounded-lg text-xs font-semibold border border-[#3b82f6] bg-[#3b82f6] text-white hover:bg-blue-600 hover:border-blue-600 cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handlePreset('week')}
              type="button"
              className="py-1.5 rounded-lg text-xs font-semibold border border-[#3b82f6] text-[#3b82f6] bg-white hover:bg-blue-50 cursor-pointer transition-colors"
            >
              1 Week
            </button>
            <button
              onClick={() => handlePreset('month')}
              type="button"
              className="py-1.5 rounded-lg text-xs font-semibold border border-[#3b82f6] text-[#3b82f6] bg-white hover:bg-blue-50 cursor-pointer transition-colors"
            >
              1 Month
            </button>
            <button
              onClick={() => handlePreset('year')}
              type="button"
              className="py-1.5 rounded-lg text-xs font-semibold border border-[#3b82f6] text-[#3b82f6] bg-white hover:bg-blue-50 cursor-pointer transition-colors"
            >
              1 Year
            </button>
          </div>

          {/* Month & Year Navigation Row */}
          <div className="flex items-center justify-between px-1">
            {/* Year Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevYear}
                type="button"
                className="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-slate-800 hover:bg-slate-100 cursor-pointer font-bold text-xs"
              >
                &lt;
              </button>
              <span className="font-bold text-[13px] text-slate-700 w-10 text-center">
                {tempDate.format('YYYY')}
              </span>
              <button
                onClick={handleNextYear}
                type="button"
                className="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-slate-800 hover:bg-slate-100 cursor-pointer font-bold text-xs"
              >
                &gt;
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                type="button"
                className="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-slate-800 hover:bg-slate-100 cursor-pointer font-bold text-xs"
              >
                &lt;
              </button>
              <span className="font-bold text-[13px] text-slate-700 w-16 text-center">
                {tempDate.format('MMMM')}
              </span>
              <button
                onClick={handleNextMonth}
                type="button"
                className="w-6 h-6 rounded-full border border-slate-400 flex items-center justify-center text-slate-800 hover:bg-slate-100 cursor-pointer font-bold text-xs"
              >
                &gt;
              </button>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="flex flex-col">
            {/* Weekdays Row */}
            <div className="grid grid-cols-7 text-center font-semibold text-slate-600 mb-2 text-xs">
              {weekDays.map((wd) => (
                <div key={wd} className="h-6 flex items-center justify-center">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {daysGrid.map(({ day, currentMonth }, idx) => {
                const selected = isSelected(day, currentMonth);
                const activeToday = isToday(day, currentMonth);

                return (
                  <button
                    key={`${day}-${currentMonth}-${idx}`}
                    onClick={() => handleDateSelect(day, currentMonth)}
                    type="button"
                    className={`w-7.5 h-7.5 flex items-center justify-center rounded-full text-xs font-medium transition-colors mx-auto cursor-pointer
                      ${
                        selected
                          ? 'bg-[#2cd5a9] text-white font-bold'
                          : currentMonth
                            ? activeToday
                              ? 'border border-[#2cd5a9] text-[#2cd5a9]'
                              : 'text-slate-800 hover:bg-slate-100'
                            : 'text-slate-300'
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              onClick={handleCancel}
              type="button"
              className="px-4 py-1.5 rounded-lg border border-[#2cd5a9] text-[#2cd5a9] font-semibold text-[13px] hover:bg-teal-50 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              type="button"
              className="px-4 py-1.5 rounded-lg bg-[#2cd5a9] text-white font-semibold text-[13px] hover:bg-[#25bfa4] cursor-pointer transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDatePicker;
