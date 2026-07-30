import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import calendarIcon from '../../../assets/icons/calenderiCon.svg';

export interface DashboardDateRange {
  start: Dayjs;
  end: Dayjs;
}

interface DashboardDateRangePickerProps {
  value: DashboardDateRange;
  onChange: (range: DashboardDateRange) => void;
}

type Preset = 'today' | 'week' | 'month' | 'year' | null;
type PickerView = 'days' | 'years' | 'months';
const FIRST_YEAR = 1976;
const LAST_YEAR = dayjs().year() + 100;

const PRESETS: Array<{ key: Exclude<Preset, null>; label: string; trigger: string }> = [
  { key: 'today', label: 'Today', trigger: 'Today' },
  { key: 'week', label: '1 Week', trigger: 'Past Week' },
  { key: 'month', label: '1 Month', trigger: 'Past Month' },
  { key: 'year', label: '1 Year', trigger: 'Past Year' },
];

const getPresetRange = (preset: Exclude<Preset, null>): DashboardDateRange => {
  const end = dayjs().startOf('day');
  if (preset === 'week') return { start: end.subtract(6, 'day'), end };
  if (preset === 'month') return { start: end.subtract(1, 'month').add(1, 'day'), end };
  if (preset === 'year') return { start: end.subtract(1, 'year').add(1, 'day'), end };
  return { start: end, end };
};

const sameDay = (left: Dayjs, right: Dayjs) => left.isSame(right, 'day');

const detectPreset = (range: DashboardDateRange): Preset =>
  PRESETS.find(({ key }) => {
    const preset = getPresetRange(key);
    return sameDay(range.start, preset.start) && sameDay(range.end, preset.end);
  })?.key ?? null;

const DashboardDateRangePicker: React.FC<DashboardDateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DashboardDateRange>(value);
  const [visibleMonth, setVisibleMonth] = useState(value.end.startOf('month'));
  const [activePreset, setActivePreset] = useState<Preset>(() => detectPreset(value));
  const [view, setView] = useState<PickerView>('days');
  const [selectingEnd, setSelectingEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setView('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (view === 'years' && yearListRef.current) {
      const selectedYear = yearListRef.current.querySelector<HTMLElement>('[data-selected-year="true"]');
      selectedYear?.scrollIntoView({ block: 'center' });
    }
  }, [view]);

  const handleOpen = () => {
    if (!isOpen) {
      setTempRange(value);
      setVisibleMonth(value.end.startOf('month'));
      setActivePreset(detectPreset(value));
      setSelectingEnd(false);
      setView('days');
    }
    setIsOpen((open) => !open);
  };

  const handlePreset = (preset: Exclude<Preset, null>) => {
    const range = getPresetRange(preset);
    setTempRange(range);
    setVisibleMonth(range.end.startOf('month'));
    setActivePreset(preset);
    setSelectingEnd(false);
    setView('days');
  };

  const handleDateSelect = (date: Dayjs) => {
    setActivePreset(null);
    if (!selectingEnd) {
      setTempRange({ start: date, end: date });
      setSelectingEnd(true);
      return;
    }
    setTempRange((current) =>
      date.isBefore(current.start, 'day')
        ? { start: date, end: current.start }
        : { start: current.start, end: date },
    );
    setSelectingEnd(false);
  };

  const handleCancel = () => {
    setTempRange(value);
    setActivePreset(detectPreset(value));
    setSelectingEnd(false);
    setView('days');
    setIsOpen(false);
  };

  const handleApply = () => {
    onChange(tempRange);
    setSelectingEnd(false);
    setView('days');
    setIsOpen(false);
  };

  const daysGrid = useMemo(() => {
    const firstOfMonth = visibleMonth.startOf('month');
    const firstGridDay = firstOfMonth.subtract(firstOfMonth.day(), 'day');
    return Array.from({ length: 42 }, (_, index) => firstGridDay.add(index, 'day'));
  }, [visibleMonth]);

  const years = useMemo(
    () => Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) => FIRST_YEAR + index),
    [],
  );

  const appliedPreset = detectPreset(value);
  const triggerLabel =
    PRESETS.find(({ key }) => key === appliedPreset)?.trigger ??
    (sameDay(value.start, value.end)
      ? value.end.format('DD/MM/YYYY')
      : `${value.start.format('DD/MM/YYYY')} - ${value.end.format('DD/MM/YYYY')}`);

  const navButtonClass =
    'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-500 text-xs font-bold text-slate-800 transition-colors hover:bg-slate-100';

  return (
    <div className="relative font-sans text-sm" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-sky-300 bg-white px-3.5 py-1.5 font-medium text-slate-700 shadow-sm transition-all hover:border-sky-400 hover:bg-slate-50"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <img src={calendarIcon} alt="" className="h-[18px] w-[18px] shrink-0" />
        <span className="text-sm font-semibold tracking-wide text-slate-600">{triggerLabel}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-[9999] mt-2.5 flex w-[330px] flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_36px_rgba(0,0,0,0.18)]"
          role="dialog"
          aria-label="Choose date range"
        >
          <div className="grid grid-cols-4 gap-3 border-b border-slate-100 pb-3">
            {PRESETS.map(({ key, label }) => {
              const selected = activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePreset(key)}
                  type="button"
                  className={`cursor-pointer rounded-md border py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-sky-500 bg-sky-500 text-white'
                      : 'border-sky-400 bg-white text-sky-500 hover:bg-sky-50'
                  }`}
                  aria-pressed={selected}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative min-h-[276px]">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <button disabled={visibleMonth.year() <= FIRST_YEAR} onClick={() => setVisibleMonth((date) => date.subtract(1, 'year'))} type="button" className={`${navButtonClass} disabled:cursor-not-allowed disabled:opacity-35`} aria-label="Previous year">&lt;</button>
                <button
                  onClick={() => setView((current) => (current === 'years' ? 'days' : 'years'))}
                  type="button"
                  className="w-12 cursor-pointer text-center text-[15px] font-bold text-slate-800 hover:text-sky-500"
                  aria-label="Choose year"
                >
                  {visibleMonth.format('YYYY')}
                </button>
                <button disabled={visibleMonth.year() >= LAST_YEAR} onClick={() => setVisibleMonth((date) => date.add(1, 'year'))} type="button" className={`${navButtonClass} disabled:cursor-not-allowed disabled:opacity-35`} aria-label="Next year">&gt;</button>
              </div>

              <div className="flex items-center gap-2">
                <button disabled={visibleMonth.year() <= FIRST_YEAR && visibleMonth.month() === 0} onClick={() => setVisibleMonth((date) => date.subtract(1, 'month'))} type="button" className={`${navButtonClass} disabled:cursor-not-allowed disabled:opacity-35`} aria-label="Previous month">&lt;</button>
                <button
                  onClick={() => setView((current) => (current === 'months' ? 'days' : 'months'))}
                  type="button"
                  className="w-16 cursor-pointer text-center text-[15px] font-bold text-slate-800 hover:text-sky-500"
                  aria-label="Choose month"
                >
                  {visibleMonth.format('MMMM')}
                </button>
                <button disabled={visibleMonth.year() >= LAST_YEAR && visibleMonth.month() === 11} onClick={() => setVisibleMonth((date) => date.add(1, 'month'))} type="button" className={`${navButtonClass} disabled:cursor-not-allowed disabled:opacity-35`} aria-label="Next month">&gt;</button>
              </div>
            </div>

            {view === 'years' && (
              <div ref={yearListRef} className="absolute left-0 top-9 z-10 h-[255px] w-[145px] overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                {years.map((year) => (
                  <button
                    key={year}
                    type="button"
                    data-selected-year={year === visibleMonth.year()}
                    onClick={() => {
                      setVisibleMonth((date) => date.year(year));
                      setView('days');
                    }}
                    className={`mb-1 block w-full cursor-pointer rounded border px-2 py-1.5 text-sm transition-colors last:mb-0 ${
                      year === visibleMonth.year()
                        ? 'border-sky-400 bg-sky-50 text-sky-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

            {view === 'months' && (
              <div className="absolute inset-x-0 top-9 z-10 grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
                {Array.from({ length: 12 }, (_, month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => {
                      setVisibleMonth((date) => date.month(month));
                      setView('days');
                    }}
                    className={`cursor-pointer rounded border py-1.5 text-sm transition-colors ${
                      month === visibleMonth.month()
                        ? 'border-sky-500 bg-sky-500 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {dayjs().month(month).format('MMM')}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-7 text-center text-xs text-slate-700">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((weekday) => (
                <div key={weekday} className="flex h-7 items-center justify-center">{weekday}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {daysGrid.map((date) => {
                const currentMonth = date.isSame(visibleMonth, 'month');
                const rangeStart = sameDay(date, tempRange.start);
                const rangeEnd = sameDay(date, tempRange.end);
                const inRange = date.isAfter(tempRange.start, 'day') && date.isBefore(tempRange.end, 'day');
                const endpoint = rangeStart || rangeEnd;
                const allowedYear = date.year() >= FIRST_YEAR && date.year() <= LAST_YEAR;

                return (
                  <button
                    key={date.format('YYYY-MM-DD')}
                    onClick={() => allowedYear && handleDateSelect(date)}
                    type="button"
                    disabled={!allowedYear}
                    className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center text-xs font-medium transition-colors ${
                      endpoint
                        ? 'rounded-full bg-emerald-400 font-bold text-white'
                        : inRange
                          ? 'rounded-none bg-blue-100 text-slate-800'
                          : currentMonth
                            ? 'rounded-full text-slate-800 hover:bg-slate-100'
                            : 'rounded-full text-slate-300 hover:bg-slate-50'
                    }`}
                    aria-label={date.format('DD MMMM YYYY')}
                    aria-pressed={endpoint || inRange}
                  >
                    {date.date()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-slate-100 bg-slate-50 px-1 pt-3">
            <button onClick={handleCancel} type="button" className="min-w-[82px] cursor-pointer rounded-md border border-emerald-400 bg-white px-4 py-2 text-[13px] font-medium text-emerald-500 transition-colors hover:bg-emerald-50">
              Cancel
            </button>
            <button onClick={handleApply} type="button" className="min-w-[78px] cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-emerald-600">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDateRangePicker;
