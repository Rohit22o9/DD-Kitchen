import React from 'react';
import { SlotInterval } from '../types';

interface AvailabilityTimelineBarProps {
  date: string;
  slots: SlotInterval[];
  loading?: boolean;
  selectedStartTime?: string;
  selectedDuration?: number;
  onSelectStartTime?: (time: string) => void;
  hasConflict?: boolean;
  conflictReason?: string;
}

interface Segment {
  startMinutes: number;
  endMinutes: number;
  startTimeStr: string;
  endTimeStr: string;
  isBooked: boolean;
  reason?: string;
}

export const AvailabilityTimelineBar: React.FC<AvailabilityTimelineBarProps> = ({
  slots = [],
  onSelectStartTime,
}) => {
  // Convert "HH:MM" to minutes from 00:00 (0 to 1440)
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

  // Filter and sort booked intervals
  const bookedSlots: { start: number; end: number; raw: SlotInterval }[] = (slots || [])
    .map((s) => {
      const start = Math.max(0, Math.min(1440, timeToMinutes(s.start_time)));
      let end = Math.max(0, Math.min(1440, timeToMinutes(s.end_time)));
      if (end <= start) end = 1440;
      return { start, end, raw: s };
    })
    .sort((a, b) => a.start - b.start);

  // Build contiguous 24-hour segments
  const segments: Segment[] = [];
  let currentPointer = 0;

  for (const b of bookedSlots) {
    if (b.start > currentPointer) {
      segments.push({
        startMinutes: currentPointer,
        endMinutes: b.start,
        startTimeStr: minutesToTimeStr(currentPointer),
        endTimeStr: minutesToTimeStr(b.start),
        isBooked: false,
      });
    }

    const bookedEnd = Math.max(currentPointer, b.end);
    segments.push({
      startMinutes: Math.max(currentPointer, b.start),
      endMinutes: bookedEnd,
      startTimeStr: minutesToTimeStr(Math.max(currentPointer, b.start)),
      endTimeStr: minutesToTimeStr(bookedEnd),
      isBooked: true,
      reason: b.raw.reason || 'Reserved Shift',
    });

    currentPointer = Math.max(currentPointer, bookedEnd);
  }

  if (currentPointer < 1440) {
    segments.push({
      startMinutes: currentPointer,
      endMinutes: 1440,
      startTimeStr: minutesToTimeStr(currentPointer),
      endTimeStr: '24:00',
      isBooked: false,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3">
      
      {/* Top Header: Simple & Clean Legend */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-extrabold text-brand-dark uppercase tracking-wider">
          24-Hour Availability Bar
        </span>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs sm:text-sm font-bold">
          <div className="flex items-center space-x-2 text-emerald-800">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs" />
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2 text-red-700">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-xs" />
            <span>Booked</span>
          </div>
        </div>
      </div>

      {/* THE PROMINENT TALL BAR (h-20 = 80px) */}
      <div className="space-y-2">
        <div className="h-20 sm:h-22 w-full bg-gray-100 rounded-2xl overflow-hidden flex border-2 border-gray-300 shadow-sm">
          {segments.map((seg, idx) => {
            const widthPct = ((seg.endMinutes - seg.startMinutes) / 1440) * 100;

            return (
              <div
                key={idx}
                style={{ width: `${widthPct}%` }}
                onClick={() => {
                  if (!seg.isBooked && onSelectStartTime) {
                    onSelectStartTime(seg.startTimeStr);
                  }
                }}
                className={`h-full relative flex flex-col items-center justify-center transition-all select-none px-2 ${
                  seg.isBooked
                    ? 'bg-red-500 text-white cursor-not-allowed'
                    : 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                }`}
                title={`${seg.startTimeStr} – ${seg.endTimeStr}: ${
                  seg.isBooked ? `Booked (${seg.reason})` : 'Available (Click to select start time)'
                }`}
              >
                {/* Large Bold Time & Status Text */}
                {widthPct >= 10 && (
                  <div className="text-center leading-snug">
                    <div className="text-sm sm:text-base md:text-lg font-black tracking-wide drop-shadow-xs">
                      {seg.startTimeStr} – {seg.endTimeStr}
                    </div>
                    <div className="text-xs sm:text-sm font-bold uppercase tracking-wider opacity-90">
                      {seg.isBooked ? 'Booked' : 'Available'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* TIME TICK MARKERS DIRECTLY BELOW THE BAR - LARGE & CLEAR */}
        <div className="relative w-full h-7 pt-1">
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
              <div className="w-0.5 h-2 bg-gray-400" />
              <span className="text-xs sm:text-sm font-bold text-gray-700 mt-1 whitespace-nowrap">
                {tick.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
