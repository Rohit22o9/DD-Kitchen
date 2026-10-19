import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sparkles, 
  Info,
  ChefHat
} from 'lucide-react';
import { SlotInterval } from '../types';
import { formatDisplayDate, formatDisplayTime } from '../services/api';

interface AvailabilityTimelineBarProps {
  date: string;
  slots: SlotInterval[];
  loading?: boolean;
  selectedStartTime: string;
  selectedDuration: number;
  onSelectStartTime: (time: string) => void;
  hasConflict?: boolean;
  conflictReason?: string;
}

interface Segment {
  startMinutes: number;
  endMinutes: number;
  startTimeStr: string;
  endTimeStr: string;
  status: 'available' | 'booked' | 'blocked';
  reason?: string;
  reference?: string;
}

export const AvailabilityTimelineBar: React.FC<AvailabilityTimelineBarProps> = ({
  date,
  slots,
  loading = false,
  selectedStartTime,
  selectedDuration,
  onSelectStartTime,
  hasConflict = false,
  conflictReason,
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null);

  // Helper to convert "HH:MM" to minutes from 00:00
  const timeToMinutes = (t: string): number => {
    if (!t) return 0;
    if (t === '24:00') return 1440;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const minutesToTimeStr = (mins: number): string => {
    const clamped = Math.max(0, Math.min(1440, mins));
    if (clamped >= 1440) return '24:00';
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Convert booked/blocked slots into normalized sorted list
  const bookedSlots: { start: number; end: number; raw: SlotInterval }[] = slots
    .map((s) => {
      const start = Math.max(0, Math.min(1440, timeToMinutes(s.start_time)));
      let end = Math.max(0, Math.min(1440, timeToMinutes(s.end_time)));
      if (end <= start) end = 1440; // Handles overnight or 24:00 wrap
      return { start, end, raw: s };
    })
    .sort((a, b) => a.start - b.start);

  // Build contiguous 24-hour segments (Green = Available, Red = Booked/Blocked)
  const segments: Segment[] = [];
  let currentPointer = 0;

  for (const b of bookedSlots) {
    if (b.start > currentPointer) {
      // Free slot before this booking
      segments.push({
        startMinutes: currentPointer,
        endMinutes: b.start,
        startTimeStr: minutesToTimeStr(currentPointer),
        endTimeStr: minutesToTimeStr(b.start),
        status: 'available',
      });
    }

    // Add booked slot
    const bookedEnd = Math.max(currentPointer, b.end);
    segments.push({
      startMinutes: Math.max(currentPointer, b.start),
      endMinutes: bookedEnd,
      startTimeStr: minutesToTimeStr(Math.max(currentPointer, b.start)),
      endTimeStr: minutesToTimeStr(bookedEnd),
      status: b.raw.status === 'blocked' ? 'blocked' : 'booked',
      reason: b.raw.reason || 'Reserved Shift',
      reference: b.raw.reference,
    });

    currentPointer = Math.max(currentPointer, bookedEnd);
  }

  // Trailing available time until midnight (1440)
  if (currentPointer < 1440) {
    segments.push({
      startMinutes: currentPointer,
      endMinutes: 1440,
      startTimeStr: minutesToTimeStr(currentPointer),
      endTimeStr: '24:00',
      status: 'available',
    });
  }

  // Calculate user requested slot position
  const reqStart = timeToMinutes(selectedStartTime);
  const reqEnd = reqStart + Math.round(selectedDuration * 60);
  const userLeftPercent = (Math.min(1440, reqStart) / 1440) * 100;
  const userWidthPercent = (Math.min(1440 - reqStart, selectedDuration * 60) / 1440) * 100;

  // 24 Hour blocks (0 to 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const isHourBooked = (hour: number): { booked: boolean; reason?: string } => {
    const hStart = hour * 60;
    const hEnd = (hour + 1) * 60;
    for (const b of bookedSlots) {
      if (Math.max(hStart, b.start) < Math.min(hEnd, b.end)) {
        return { booked: true, reason: b.raw.reason || 'Reserved Shift' };
      }
    }
    return { booked: false };
  };

  const isHourSelected = (hour: number): boolean => {
    const hStart = hour * 60;
    const hEnd = (hour + 1) * 60;
    return Math.max(hStart, reqStart) < Math.min(hEnd, reqEnd);
  };

  // Summary counts
  const totalBookedMinutes = bookedSlots.reduce((sum, b) => sum + (b.end - b.start), 0);
  const totalBookedHours = Math.round((totalBookedMinutes / 60) * 10) / 10;
  const availableHours = Math.max(0, 24 - totalBookedHours);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      
      {/* Header & Date Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs sm:text-sm font-extrabold text-brand-dark uppercase tracking-wide">
              24-Hour Kitchen Occupancy Timeline
            </h4>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Timeline for <strong className="text-brand-dark">{formatDisplayDate(date)}</strong> (00:00 to 24:00)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600 flex-wrap">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
            <span className="text-emerald-800">Available Slot</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 shadow-xs" />
            <span className="text-rose-800">Booked Slot</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-md border-2 border-brand-forest bg-brand-forest/20 shadow-xs" />
            <span className="text-brand-forest">Your Shift</span>
          </div>
        </div>
      </div>

      {/* CONTINUOUS 24-HOUR VISUAL BAR */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
          <span>00:00 (Midnight)</span>
          <span>06:00 AM</span>
          <span>12:00 PM (Noon)</span>
          <span>06:00 PM</span>
          <span>24:00 (Midnight)</span>
        </div>

        {/* Multi-segment Timeline Bar */}
        <div className="relative h-10 w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200/90 flex shadow-inner">
          {segments.map((seg, idx) => {
            const widthPct = ((seg.endMinutes - seg.startMinutes) / 1440) * 100;
            const isBooked = seg.status === 'booked' || seg.status === 'blocked';

            return (
              <div
                key={idx}
                style={{ width: `${widthPct}%` }}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => {
                  if (!isBooked) {
                    onSelectStartTime(seg.startTimeStr);
                  }
                }}
                className={`h-full relative group transition-all flex items-center justify-center text-[10px] font-black select-none ${
                  isBooked
                    ? 'bg-rose-500 text-white hover:bg-rose-600 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
                }`}
                title={`${seg.startTimeStr} – ${seg.endTimeStr}: ${
                  isBooked ? `Booked (${seg.reason})` : 'Available (Click to select start time)'
                }`}
              >
                {/* Diagonal stripes on booked slot for rich look */}
                {isBooked && (
                  <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 0, transparent 8px)'
                    }}
                  />
                )}

                {/* Text inside bar if wide enough */}
                {widthPct >= 10 && (
                  <span className="truncate px-1.5 relative z-10 drop-shadow-xs">
                    {isBooked ? 'Booked' : 'Available'}
                  </span>
                )}
              </div>
            );
          })}

          {/* User Requested Slot Indicator Highlight */}
          <div
            style={{
              left: `${userLeftPercent}%`,
              width: `${userWidthPercent}%`,
            }}
            className={`absolute top-0 bottom-0 pointer-events-none border-2 transition-all rounded-lg z-20 flex items-center justify-center ${
              hasConflict
                ? 'border-yellow-400 bg-yellow-400/30 animate-pulse'
                : 'border-brand-dark bg-brand-forest/20 shadow-md ring-2 ring-white/70'
            }`}
          >
            <span className="hidden sm:inline text-[9px] font-black text-brand-dark bg-white/95 px-1.5 py-0.5 rounded shadow-xs truncate">
              {hasConflict ? '⚠️ Conflict' : 'Your Shift'}
            </span>
          </div>
        </div>

        {/* 24-HOUR TICK MARKERS */}
        <div className="relative w-full h-4">
          {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((tick) => (
            <div
              key={tick}
              style={{ left: `${(tick / 24) * 100}%` }}
              className="absolute -translate-x-1/2 flex flex-col items-center"
            >
              <div className="w-0.5 h-1.5 bg-gray-300" />
              <span className="text-[9px] font-semibold text-gray-400">
                {String(tick).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 24 HOURLY INTERACTIVE BLOCKS (Clickable) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Hourly Slot Grid (Click any green block to select start time):
          </span>
          <span className="text-[11px] text-brand-muted font-medium">
            {availableHours}h Free • {totalBookedHours}h Booked
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {hours.map((h) => {
            const timeStr = `${String(h).padStart(2, '0')}:00`;
            const { booked, reason } = isHourBooked(h);
            const isSelected = isHourSelected(h);
            const isStart = selectedStartTime === timeStr;

            return (
              <button
                key={h}
                type="button"
                onClick={() => {
                  if (!booked) {
                    onSelectStartTime(timeStr);
                  }
                }}
                onMouseEnter={() => setHoveredHour(h)}
                onMouseLeave={() => setHoveredHour(null)}
                disabled={booked}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  booked
                    ? 'bg-rose-50 border border-rose-200 text-rose-700 cursor-not-allowed hover:bg-rose-100'
                    : isStart
                    ? 'bg-brand-forest text-white ring-2 ring-brand-forest ring-offset-1 font-black shadow-sm scale-105 z-10'
                    : isSelected
                    ? 'bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-black'
                    : 'bg-emerald-50/80 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400'
                }`}
                title={`${timeStr}: ${booked ? `Booked (${reason})` : 'Available — Click to set as start time'}`}
              >
                <span className="text-[11px] font-bold leading-tight">
                  {h % 12 || 12}
                  <span className="text-[9px] font-medium ml-0.5">
                    {h >= 12 ? 'PM' : 'AM'}
                  </span>
                </span>

                {/* Color Dot indicator */}
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    booked
                      ? 'bg-rose-500'
                      : isStart
                      ? 'bg-white'
                      : 'bg-emerald-500'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* DETAILED SLOTS LIST (Red vs Green breakdown cards) */}
      <div className="pt-2 border-t border-gray-100 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
          Current Day Schedule Breakdown:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {segments.map((seg, idx) => {
            const isBooked = seg.status === 'booked' || seg.status === 'blocked';
            const durHrs = (seg.endMinutes - seg.startMinutes) / 60;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (!isBooked) {
                    onSelectStartTime(seg.startTimeStr);
                  }
                }}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                  isBooked
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900 cursor-not-allowed'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:bg-emerald-100/80 cursor-pointer shadow-2xs hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isBooked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isBooked ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold flex items-center gap-1.5 truncate">
                      <span>{seg.startTimeStr} – {seg.endTimeStr}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                        isBooked ? 'bg-rose-200/80 text-rose-800' : 'bg-emerald-200/80 text-emerald-800'
                      }`}>
                        {isBooked ? 'Booked' : 'Available'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {isBooked ? (seg.reason || 'Reserved Shift') : `${durHrs} continuous hour(s) open`}
                    </div>
                  </div>
                </div>

                {!isBooked && (
                  <span className="text-[11px] font-bold text-emerald-700 underline shrink-0 ml-2">
                    Select
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Status / Conflict Message Banner */}
      {hasConflict ? (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">Time Conflict Detected: </span>
            <span>{conflictReason || 'Your requested shift overlaps an already booked slot (red bar). Please select an open green hour above.'}</span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">
            Your selected window (<strong>{selectedStartTime}</strong> for <strong>{selectedDuration}h</strong>) is fully available in green!
          </span>
        </div>
      )}

    </div>
  );
};
