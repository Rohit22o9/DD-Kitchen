import React, { useState } from 'react';
import { SlotInterval } from '../types';
import { formatDisplayDate } from '../services/api';

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
  const bookedSlots: { start: number; end: number; raw: SlotInterval }[] = (slots || [])
    .map((s) => {
      const start = Math.max(0, Math.min(1440, timeToMinutes(s.start_time)));
      let end = Math.max(0, Math.min(1440, timeToMinutes(s.end_time)));
      if (end <= start) end = 1440;
      return { start, end, raw: s };
    })
    .sort((a, b) => a.start - b.start);

  // Build contiguous 24-hour segments across the single line
  const segments: Segment[] = [];
  let currentPointer = 0;

  for (const b of bookedSlots) {
    if (b.start > currentPointer) {
      segments.push({
        startMinutes: currentPointer,
        endMinutes: b.start,
        startTimeStr: minutesToTimeStr(currentPointer),
        endTimeStr: minutesToTimeStr(b.start),
        status: 'available',
      });
    }

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

  if (currentPointer < 1440) {
    segments.push({
      startMinutes: currentPointer,
      endMinutes: 1440,
      startTimeStr: minutesToTimeStr(currentPointer),
      endTimeStr: '24:00',
      status: 'available',
    });
  }

  // Calculate user requested slot position on the single line
  const reqStart = timeToMinutes(selectedStartTime);
  const userLeftPercent = (Math.min(1440, reqStart) / 1440) * 100;
  const userWidthPercent = (Math.min(1440 - reqStart, selectedDuration * 60) / 1440) * 100;

  // Total booked hours
  const totalBookedMinutes = bookedSlots.reduce((sum, b) => sum + (b.end - b.start), 0);
  const totalBookedHours = Math.round((totalBookedMinutes / 60) * 10) / 10;
  const availableHours = Math.max(0, Math.round((24 - totalBookedHours) * 10) / 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-xs space-y-2.5">
      
      {/* Top Header: Title & Clean Legend */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-brand-dark uppercase tracking-wider text-[11px]">
            24-Hour Availability Bar
          </span>
          <span className="text-[11px] text-brand-muted hidden sm:inline">
            ({availableHours}h Available • {totalBookedHours}h Booked)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] font-bold">
          <div className="flex items-center space-x-1.5 text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1.5 text-red-800">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
            <span>Booked</span>
          </div>
          <div className="flex items-center space-x-1.5 text-brand-dark hidden xs:flex">
            <span className="w-2.5 h-2.5 rounded-sm border-2 border-brand-dark bg-brand-forest/30" />
            <span>Your Shift</span>
          </div>
        </div>
      </div>

      {/* THE SINGLE 24-HOUR LINE BAR */}
      <div className="relative pt-1 pb-1">
        
        {/* Continuous Bar Container */}
        <div className="relative h-8 sm:h-9 w-full bg-gray-100 rounded-xl overflow-hidden flex border border-gray-300 shadow-inner">
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
                className={`h-full relative flex items-center justify-center text-[10px] font-bold transition-all select-none ${
                  isBooked
                    ? 'bg-red-500 text-white cursor-not-allowed hover:bg-red-600'
                    : 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                }`}
                title={`${seg.startTimeStr} – ${seg.endTimeStr}: ${
                  isBooked ? `Booked (${seg.reason})` : 'Available (Click to select start time)'
                }`}
              >
                {/* Diagonal stripes on booked slot for texture */}
                {isBooked && (
                  <div 
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 0, transparent 6px)'
                    }}
                  />
                )}

                {/* Text inside bar if wide enough */}
                {widthPct >= 12 && (
                  <span className="truncate px-1 relative z-10 drop-shadow-xs">
                    {isBooked ? 'Booked' : `${seg.startTimeStr}–${seg.endTimeStr}`}
                  </span>
                )}
              </div>
            );
          })}

          {/* User Requested Shift Indicator on the single line */}
          <div
            style={{
              left: `${userLeftPercent}%`,
              width: `${userWidthPercent}%`,
            }}
            className={`absolute top-0 bottom-0 pointer-events-none border-2 transition-all rounded-lg z-20 flex items-center justify-center ${
              hasConflict
                ? 'border-yellow-400 bg-yellow-400/35 ring-2 ring-yellow-400/50 animate-pulse'
                : 'border-brand-dark bg-brand-forest/25 ring-2 ring-white/80 shadow-md'
            }`}
          >
            <span className="text-[9px] font-black text-brand-dark bg-white/95 px-1 py-0.2 rounded shadow-xs truncate leading-none">
              {hasConflict ? '⚠️ Conflict' : 'Your Shift'}
            </span>
          </div>
        </div>

        {/* TIME TICKS DIRECTLY BELOW THE SINGLE LINE BAR */}
        <div className="relative w-full h-4 mt-1">
          {[
            { hour: 0, label: '12 AM' },
            { hour: 4, label: '4 AM' },
            { hour: 8, label: '8 AM' },
            { hour: 12, label: '12 PM' },
            { hour: 16, label: '4 PM' },
            { hour: 20, label: '8 PM' },
            { hour: 24, label: '12 AM' },
          ].map((tick) => (
            <div
              key={tick.hour}
              style={{ left: `${(tick.hour / 24) * 100}%` }}
              className="absolute -translate-x-1/2 flex flex-col items-center"
            >
              <div className="w-0.5 h-1 bg-gray-300" />
              <span className="text-[9px] font-semibold text-gray-500 whitespace-nowrap">
                {tick.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover Info Tooltip Banner */}
      {hoveredSegment ? (
        <div className="text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200/80 flex items-center justify-between">
          <span>
            <strong>{hoveredSegment.startTimeStr} – {hoveredSegment.endTimeStr}</strong>:{' '}
            {hoveredSegment.status === 'booked' || hoveredSegment.status === 'blocked' ? (
              <span className="text-red-700 font-bold">Booked ({hoveredSegment.reason})</span>
            ) : (
              <span className="text-emerald-700 font-bold">Available (Click to select start time)</span>
            )}
          </span>
          {hoveredSegment.status === 'available' && (
            <span className="text-[10px] text-emerald-800 font-semibold underline cursor-pointer">
              Click to select
            </span>
          )}
        </div>
      ) : hasConflict ? (
        <div className="text-[11px] text-red-700 bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 font-semibold flex items-center space-x-1.5">
          <span>⚠️</span>
          <span>{conflictReason || 'Selected time window conflicts with a booked slot (red). Choose another time.'}</span>
        </div>
      ) : null}

    </div>
  );
};
