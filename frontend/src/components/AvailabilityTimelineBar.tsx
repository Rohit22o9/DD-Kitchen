import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
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
  status: 'available' | 'booked' | 'blocked';
  reason?: string;
  reference?: string;
}

export const AvailabilityTimelineBar: React.FC<AvailabilityTimelineBarProps> = ({
  date,
  slots = [],
  loading = false,
  selectedStartTime = '09:00',
  selectedDuration = 4,
  onSelectStartTime,
  hasConflict = false,
  conflictReason,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null);

  // Helper to convert "HH:MM" to minutes from 00:00 (0 to 1440)
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

  // Summary counts
  const totalBookedMinutes = bookedSlots.reduce((sum, b) => sum + (b.end - b.start), 0);
  const totalBookedHours = Math.round((totalBookedMinutes / 60) * 10) / 10;
  const availableHours = Math.max(0, Math.round((24 - totalBookedHours) * 10) / 10);

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
      
      {/* Top Header: Title & Clean Legend with larger typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <Clock className="w-5 h-5 text-brand-forest" />
          <h4 className="text-sm sm:text-base font-extrabold text-brand-dark uppercase tracking-wider">
            24-Hour Availability Bar
          </h4>
          <span className="text-xs sm:text-sm font-semibold text-brand-muted">
            ({availableHours}h Available • {totalBookedHours}h Booked)
          </span>
        </div>

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

      {/* THE PROMINENT, LARGE 24-HOUR LINE BAR */}
      <div className="space-y-2">
        
        {/* Generous Height Bar (h-14 on mobile, h-16 on desktop) */}
        <div className="relative h-14 sm:h-16 w-full bg-gray-100 rounded-2xl overflow-hidden flex border-2 border-gray-300 shadow-sm">
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
                  if (!isBooked && onSelectStartTime) {
                    onSelectStartTime(seg.startTimeStr);
                  }
                }}
                className={`h-full relative flex flex-col items-center justify-center transition-all select-none px-2 ${
                  isBooked
                    ? 'bg-red-500 text-white cursor-not-allowed hover:bg-red-600'
                    : 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                }`}
                title={`${seg.startTimeStr} – ${seg.endTimeStr}: ${
                  isBooked ? `Booked (${seg.reason})` : 'Available (Click to select start time)'
                }`}
              >
                {/* Diagonal subtle texture on booked segments */}
                {isBooked && (
                  <div 
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 3px, transparent 0, transparent 9px)'
                    }}
                  />
                )}

                {/* Big, Clear, Bold Labels inside the bar */}
                {widthPct >= 12 && (
                  <div className="relative z-10 text-center leading-tight">
                    <div className="text-xs sm:text-sm md:text-base font-black tracking-wide drop-shadow-xs">
                      {seg.startTimeStr} – {seg.endTimeStr}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider opacity-90">
                      {isBooked ? 'Booked' : 'Available'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* User Requested Shift Indicator Overlay */}
          <div
            style={{
              left: `${userLeftPercent}%`,
              width: `${userWidthPercent}%`,
            }}
            className={`absolute top-0 bottom-0 pointer-events-none border-3 transition-all rounded-xl z-20 flex items-center justify-center ${
              hasConflict
                ? 'border-amber-400 bg-amber-400/40 ring-4 ring-amber-400/50 animate-pulse'
                : 'border-brand-dark bg-brand-forest/20 ring-4 ring-white/90 shadow-lg'
            }`}
          >
            <div className="px-2.5 py-1 rounded-md bg-white/95 text-brand-dark font-black text-xs sm:text-sm shadow-md flex items-center space-x-1 border border-gray-200">
              {hasConflict ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700">Conflict</span>
                </>
              ) : (
                <>
                  <span className="text-brand-forest">Your Shift</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TIME TICK MARKERS DIRECTLY BELOW THE BAR - LARGE & CLEAR */}
        <div className="relative w-full h-6 pt-1">
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

      {/* Clear Status / Conflict Notification Box */}
      <div className="pt-2">
        {hasConflict ? (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-semibold flex items-start space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Selected time window conflicts with a reserved shift:</p>
              <p className="mt-0.5 text-xs text-red-700 font-normal">
                {conflictReason || 'Please adjust your Start Time or Duration to fit inside the green available slots.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Your selected slot ({selectedStartTime} for {selectedDuration} hours) is available in the green zone!
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
