import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ChefHat, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import { api, formatDisplayDate } from '../services/api';
import { DayAvailabilitySummary, SlotInterval } from '../types';

interface AvailabilityCalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  minDate?: string;     // YYYY-MM-DD
  onSelectQuickSlot?: (startTime: string, duration: number) => void;
  className?: string;
}

export const AvailabilityCalendarPicker: React.FC<AvailabilityCalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
  minDate,
  onSelectQuickSlot,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date to view month & year
  const parseYearMonth = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { year: parts[0], month: parts[1] };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  };

  const initialYM = parseYearMonth(selectedDate);
  const [viewYear, setViewYear] = useState<number>(initialYM.year);
  const [viewMonth, setViewMonth] = useState<number>(initialYM.month);

  const [monthData, setMonthData] = useState<Record<string, DayAvailabilitySummary>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Sync view month when selectedDate changes from outside (e.g. quick buttons)
  useEffect(() => {
    if (selectedDate) {
      const ym = parseYearMonth(selectedDate);
      setViewYear(ym.year);
      setViewMonth(ym.month);
    }
  }, [selectedDate]);

  // Load monthly availability whenever viewYear or viewMonth changes
  useEffect(() => {
    let isMounted = true;
    async function fetchMonthData() {
      setLoading(true);
      try {
        const data = await api.getMonthAvailability(viewYear, viewMonth);
        if (isMounted) {
          setMonthData(data);
        }
      } catch (err) {
        console.error('Failed to load month availability', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchMonthData();
    return () => {
      isMounted = false;
    };
  }, [viewYear, viewMonth]);

  // Close popover on outside click and Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1);
      setViewMonth(12);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1);
      setViewMonth(1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleJumpToCurrent = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
  };

  // Month calculation helpers
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Number of days in viewMonth
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  // Day of week of the 1st day (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  // Selected day info
  const selectedDayInfo = monthData[selectedDate];

  // Quick preset shifts
  const quickShifts = [
    { label: 'Morning Bake', start: '06:00', duration: 4, icon: '🌅' },
    { label: 'Standard Shift', start: '09:00', duration: 4, icon: '☀️' },
    { label: 'Afternoon Batch', start: '13:00', duration: 4, icon: '☕' },
    { label: 'Dinner Prep', start: '17:00', duration: 4, icon: '🌆' },
    { label: 'Overnight Production', start: '22:00', duration: 6, icon: '🌙' },
  ];

  // Helper to check if a quick slot conflicts with selected day's booked slots
  const isQuickSlotAvailable = (start: string, duration: number, slots?: SlotInterval[]) => {
    if (!slots || slots.length === 0) return true;
    const [sh, sm] = start.split(':').map(Number);
    const reqStart = sh * 60 + sm;
    const reqEnd = reqStart + duration * 60;

    for (const slot of slots) {
      const [slotSh, slotSm] = slot.start_time.split(':').map(Number);
      const [slotEh, slotEm] = slot.end_time.split(':').map(Number);
      const sStart = slotSh * 60 + slotSm;
      const sEnd = slotEh * 60 + slotEm;
      if (Math.max(reqStart, sStart) < Math.min(reqEnd, sEnd)) {
        return false;
      }
    }
    return true;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      
      {/* TRIGGER INPUT BAR */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full px-4 py-3 rounded-xl border transition-all cursor-pointer bg-white flex items-center justify-between shadow-xs select-none ${
          isOpen
            ? 'border-brand-forest ring-2 ring-brand-forest/30 shadow-md'
            : 'border-gray-300 hover:border-brand-forest/60 hover:bg-gray-50/50'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-brand-forest/10 text-brand-forest flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5 text-brand-forest" />
          </div>

          <div className="text-left min-w-0">
            <div className="text-sm font-bold text-brand-dark truncate">
              {formatDisplayDate(selectedDate)}
            </div>
            <div className="text-[11px] text-brand-muted flex items-center gap-1.5 flex-wrap">
              <span>Date: {selectedDate}</span>
              <span>•</span>
              {selectedDayInfo ? (
                selectedDayInfo.status === 'available' ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    All Hours Available (24h)
                  </span>
                ) : selectedDayInfo.status === 'partially_booked' ? (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Partially Booked ({selectedDayInfo.available_hours}h Free)
                  </span>
                ) : (
                  <span className="text-red-700 font-semibold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Fully Booked / Blocked
                  </span>
                )
              ) : (
                <span className="text-gray-500">Click to view calendar</span>
              )}
            </div>
          </div>
        </div>

        {/* Right side pills and chevron */}
        <div className="flex items-center space-x-2 shrink-0">
          {selectedDayInfo?.equipment_in_use && selectedDayInfo.equipment_in_use.length > 0 && (
            <span 
              className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"
              title={`Equipment reserved: ${selectedDayInfo.equipment_in_use.join(', ')}`}
            >
              <ChefHat className="w-3 h-3 text-blue-600" />
              <span>{selectedDayInfo.equipment_in_use.length} Eq. Active</span>
            </span>
          )}

          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* QUICK PRESETS ROW */}
      <div className="flex flex-wrap gap-2 mt-2.5">
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            onSelectDate(d.toISOString().split('T')[0]);
          }}
          className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() + 2);
            onSelectDate(d.toISOString().split('T')[0]);
          }}
          className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
        >
          In 2 Days
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
            onSelectDate(d.toISOString().split('T')[0]);
          }}
          className="text-xs px-2.5 py-1 rounded-md bg-white border border-gray-200 text-brand-dark hover:bg-brand-mint hover:border-brand-forest/30 transition-colors cursor-pointer"
        >
          Upcoming Weekend
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs px-2.5 py-1 rounded-md bg-brand-forest/10 border border-brand-forest/20 text-brand-forest font-bold hover:bg-brand-forest hover:text-white transition-all cursor-pointer ml-auto flex items-center space-x-1"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Close Calendar' : 'Open Color Calendar'}</span>
        </button>
      </div>

      {/* DROPDOWN / POPOVER CALENDAR */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-3 z-50 w-full sm:w-[500px] md:w-[540px] bg-white rounded-2xl shadow-2xl border border-gray-200/90 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header: Month / Year Title & Navigation */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-black text-brand-dark">
                {monthNames[viewMonth - 1]} {viewYear}
              </span>
              <button
                type="button"
                onClick={handleJumpToCurrent}
                className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 hover:bg-brand-forest hover:text-white transition-colors cursor-pointer font-semibold"
              >
                Today
              </button>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-brand-dark transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 hover:text-brand-dark transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Color Legend Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 py-2.5 px-3 my-2.5 rounded-xl bg-gray-50 text-[11px] font-semibold text-gray-600 border border-gray-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
              <span>Partial Slot</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
              <span>Fully Booked</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
              <span>Equipment In Use</span>
            </div>
          </div>

          {/* Day of Week Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d, i) => (
              <div key={i} className="text-xs font-bold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty offset days for previous month */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-11 sm:h-12 rounded-xl bg-transparent" />
            ))}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              const isPast = minDate ? dateStr < minDate : false;
              const isSelected = dateStr === selectedDate;
              const daySummary = monthData[dateStr];

              const status = daySummary?.status || 'available';
              const hasEquipment = daySummary?.equipment_in_use && daySummary.equipment_in_use.length > 0;
              const bookedHours = daySummary?.total_booked_hours || 0;
              const isFull = status === 'fully_booked' || status === 'blocked';

              // Visual styling based on state and status
              let cellClass = '';
              let badgeColor = '';

              if (isSelected) {
                cellClass = 'bg-brand-forest text-white ring-2 ring-brand-forest ring-offset-2 font-black shadow-md scale-[1.04] z-10';
              } else if (isPast) {
                cellClass = 'text-gray-300 bg-gray-50/40 cursor-not-allowed border border-transparent';
              } else if (isFull) {
                cellClass = 'bg-red-50/70 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer';
                badgeColor = 'bg-red-500';
              } else if (status === 'partially_booked') {
                cellClass = 'bg-amber-50/70 border border-amber-200 text-amber-900 hover:bg-amber-100 hover:border-amber-300 cursor-pointer';
                badgeColor = 'bg-amber-500';
              } else {
                // Fully available
                cellClass = 'bg-emerald-50/50 border border-emerald-100/80 text-emerald-950 hover:bg-emerald-100/70 hover:border-emerald-300 cursor-pointer';
                badgeColor = 'bg-emerald-500';
              }

              return (
                <div
                  key={dateStr}
                  role="button"
                  tabIndex={isPast ? -1 : 0}
                  aria-disabled={isPast}
                  onClick={() => {
                    if (!isPast) {
                      onSelectDate(dateStr);
                    }
                  }}
                  onMouseEnter={() => setHoveredDate(dateStr)}
                  onMouseLeave={() => setHoveredDate(null)}
                  className={`relative h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all ${cellClass}`}
                >
                  {/* Day Number */}
                  <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                    {day}
                  </span>

                  {/* Micro indicator dots row */}
                  {!isPast && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {/* Availability status dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : badgeColor
                        }`}
                      />
                      {/* Equipment in use indicator dot */}
                      {hasEquipment && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-blue-200' : 'bg-blue-600'
                          }`}
                          title={`Equipment reserved: ${daySummary.equipment_in_use.join(', ')}`}
                        />
                      )}
                    </div>
                  )}

                  {/* Tiny label for partial / booked */}
                  {!isPast && !isSelected && status === 'partially_booked' && (
                    <span className="text-[9px] font-black text-amber-800 leading-none mt-0.5">
                      {24 - bookedHours}h free
                    </span>
                  )}
                  {!isPast && !isSelected && isFull && (
                    <span className="text-[9px] font-black text-red-600 leading-none mt-0.5">
                      Full
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hover Tooltip / Preview Info Banner */}
          {hoveredDate && monthData[hoveredDate] && (
            <div className="mt-3 p-2.5 rounded-xl bg-brand-cream border border-brand-mint-border text-xs text-brand-dark flex items-start justify-between animate-in fade-in duration-100">
              <div>
                <span className="font-bold text-brand-forest">
                  {formatDisplayDate(hoveredDate)}:
                </span>{' '}
                {monthData[hoveredDate].status === 'available' ? (
                  <span className="text-emerald-700 font-semibold">All 24 hours open & unreserved</span>
                ) : monthData[hoveredDate].status === 'partially_booked' ? (
                  <span className="text-amber-800 font-semibold">
                    {monthData[hoveredDate].bookings_count} booking(s) ({monthData[hoveredDate].total_booked_hours}h reserved) • {monthData[hoveredDate].available_hours}h available
                  </span>
                ) : (
                  <span className="text-red-700 font-semibold">Fully booked or blocked for maintenance</span>
                )}

                {monthData[hoveredDate].equipment_in_use.length > 0 && (
                  <div className="text-[11px] text-blue-700 mt-1 flex items-center gap-1 font-medium">
                    <ChefHat className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>In-use equipment: {monthData[hoveredDate].equipment_in_use.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE DAY SPOTLIGHT & QUICK SHIFT SELECTION */}
          <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-brand-forest" />
                <span className="text-xs font-bold text-brand-dark uppercase tracking-wide">
                  Schedule for {formatDisplayDate(selectedDate)}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-brand-muted">
                {selectedDayInfo?.slots.length || 0} reserved shift(s)
              </span>
            </div>

            {/* List reserved shifts for selected day if any */}
            {selectedDayInfo && selectedDayInfo.slots.length > 0 ? (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {selectedDayInfo.slots.map((s, idx) => (
                  <div
                    key={idx}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                      s.status === 'blocked'
                        ? 'bg-gray-100 border-gray-200 text-gray-700'
                        : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Lock className="w-3 h-3 text-gray-500" />
                      <span className="font-bold">
                        {s.start_time} – {s.end_time}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium">{s.reason || 'Booked Slot'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-800 text-center font-medium">
                ✨ Zero conflicts recorded! 24-hour open kitchen availability on this date.
              </div>
            )}

            {/* Quick Shift Click-to-Select */}
            {onSelectQuickSlot && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  1-Click Available Shifts:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {quickShifts.map((qs, idx) => {
                    const isAvailable = isQuickSlotAvailable(qs.start, qs.duration, selectedDayInfo?.slots);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (isAvailable) {
                            onSelectQuickSlot(qs.start, qs.duration);
                            setIsOpen(false);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-all border ${
                          isAvailable
                            ? 'bg-white hover:bg-brand-mint border-gray-200 hover:border-brand-forest/40 text-brand-dark cursor-pointer'
                            : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                        }`}
                      >
                        <div className="font-bold flex items-center justify-between">
                          <span>{qs.icon} {qs.start}</span>
                          <span className="text-[10px] text-brand-muted">{qs.duration}h</span>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{qs.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-brand-muted italic">
                *Click any date or quick shift to select
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-brand-forest text-white text-xs font-bold hover:bg-brand-forest-light transition-all shadow-sm cursor-pointer"
              >
                Apply & Close
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
