import React from 'react';
import { SlotInterval } from '../types';
import { formatDisplayDate } from '../services/api';

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

export const AvailabilityTimelineBar: React.FC<AvailabilityTimelineBarProps> = ({
  date,
  slots = [],
  loading = false,
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
  const bookedSlots = (slots || [])
    .map((s) => {
      const start = Math.max(0, Math.min(1440, timeToMinutes(s.start_time)));
      let end = Math.max(0, Math.min(1440, timeToMinutes(s.end_time)));
      if (end <= start) end = 1440;
      return { start, end, raw: s };
    })
    .sort((a, b) => a.start - b.start);

  // Build contiguous segments across the single line
  const segments: {
    startMinutes: number;
    endMinutes: number;
    startTimeStr: string;
    endTimeStr: string;
    isBooked: boolean;
    reason?: string;
  }[] = [];

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

  // Summary counts
  const totalBookedMinutes = bookedSlots.reduce((sum, b) => sum + (b.end - b.start), 0);
  const totalBookedHours = Math.round((totalBookedMinutes / 60) * 10) / 10;
  const availableHours = Math.max(0, Math.round((24 - totalBookedHours) * 10) / 10);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2">
      
      {/* Header Row: Label & Simple Legend */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
          24-Hour Availability Bar
        </span>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-[11px] font-semibold">
          <div className="flex items-center space-x-1.5 text-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Available ({availableHours}h)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Booked ({totalBookedHours}h)</span>
          </div>
        </div>
      </div>

      {/* THE SINGLE 24-HOUR LINE BAR */}
      <div className="relative pt-0.5">
        
        {/* Single Line Progress Track */}
        <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden flex border border-gray-300 shadow-inner">
          {segments.map((seg, idx) => {
            const widthPct = ((seg.endMinutes - seg.startMinutes) / 1440) * 100;
            return (
              <div
                key={idx}
                style={{ width: `${widthPct}%` }}
                className={`h-full transition-all relative ${
                  seg.isBooked ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                title={`${seg.startTimeStr} – ${seg.endTimeStr}: ${
                  seg.isBooked ? `Booked (${seg.reason})` : 'Available'
                }`}
              />
            );
          })}
        </div>

        {/* TIME TICKS BELOW THE SINGLE LINE */}
        <div className="flex justify-between text-[10px] text-gray-500 font-medium px-0.5 pt-1.5 select-none">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>12 AM</span>
        </div>
      </div>

      {/* Single Line Status Note */}
      <div className="text-[11px] text-brand-muted pt-0.5 border-t border-gray-100">
        {bookedSlots.length > 0 ? (
          <div className="flex items-center space-x-1.5 text-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>
              <strong>Reserved shift:</strong>{' '}
              {bookedSlots.map((b) => `${minutesToTimeStr(b.start)} – ${minutesToTimeStr(b.end)}`).join(', ')}
              {' '}(red). All other hours are open (green).
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>All 24 hours are currently open on this date.</span>
          </div>
        )}
      </div>

    </div>
  );
};
