import React, { useMemo } from 'react';
import { 
  Clock, 
  Layers, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Info
} from 'lucide-react';
import { AvailabilityData, SlotInterval } from '../types';
import { formatDisplayDate, formatDisplayTime } from '../services/api';

interface StationTimelineBarsProps {
  selectedDate: string;
  startTime: string; // '09:00'
  duration: number;   // 4
  availability: AvailabilityData | null;
  onSelectSlot: (startTime: string, duration: number) => void;
  className?: string;
}

interface StationConfig {
  id: string;
  name: string;
  colorDot: string;
  keywords: string[];
}

export const StationTimelineBars: React.FC<StationTimelineBarsProps> = ({
  selectedDate,
  startTime,
  duration,
  availability,
  onSelectSlot,
  className = '',
}) => {
  // Define stations matching the Admin Panel Gantt chart
  const stations: StationConfig[] = [
    {
      id: 'prep-1',
      name: 'Prep Bench 1',
      colorDot: 'bg-emerald-500',
      keywords: ['prep bench 1', 'prep bench', 'prep table', 'stainless food prep table'],
    },
    {
      id: 'prep-2',
      name: 'Prep Bench 2',
      colorDot: 'bg-emerald-500',
      keywords: ['prep bench 2', 'prep benches', 'bench 2'],
    },
    {
      id: 'combi',
      name: 'Combi Oven',
      colorDot: 'bg-[#ED8533]',
      keywords: ['combi oven', 'rational combi oven', 'oven', 'convection oven'],
    },
    {
      id: 'range',
      name: '6-Burner Range',
      colorDot: 'bg-[#ED8533]',
      keywords: ['6-burner', 'gas range', 'range', 'cooktop'],
    },
    {
      id: 'mixer',
      name: 'Planetary Mixer',
      colorDot: 'bg-blue-500',
      keywords: ['mixer', 'planetary mixer', 'spiral mixer', 'baking oven', 'deck oven'],
    },
  ];

  // Total 24 hours in minutes
  const TOTAL_DAY_MINS = 24 * 60; // 1440

  // Helper to parse HH:MM to minutes from midnight
  const parseMins = (tStr: string): number => {
    if (!tStr) return 0;
    if (tStr === '24:00') return 1440;
    const [h, m] = tStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // User requested window in minutes
  const [userStartH, userStartM] = startTime.split(':').map(Number);
  const userStartMins = (userStartH || 0) * 60 + (userStartM || 0);
  const userEndMins = userStartMins + Math.round(duration * 60);

  // Check if user's requested window overlaps any booked slot on the date
  const bookedSlots = availability?.slots || [];

  // Group booked slots by station
  const stationOccupancy = useMemo(() => {
    return stations.map((st) => {
      // Find slots that specifically request this equipment or general slots
      const matchingSlots = bookedSlots.filter((slot) => {
        if (!slot.equipment && !slot.reason) return true; // General reservation blocks all
        const eqStr = (slot.equipment || '').toLowerCase();
        const reasonStr = (slot.reason || '').toLowerCase();
        const isMatch = st.keywords.some((k) => eqStr.includes(k) || reasonStr.includes(k));
        return isMatch || (!eqStr && !reasonStr.includes('bench')); // General booking affects stations
      });

      // Calculate available intervals in the 24 hours for this station
      const sorted = [...matchingSlots].sort((a, b) => parseMins(a.start_time) - parseMins(b.start_time));
      const availableIntervals: { startMins: number; endMins: number }[] = [];
      let cursor = 0;

      for (const slot of sorted) {
        const sMins = parseMins(slot.start_time);
        const eMins = parseMins(slot.end_time);
        if (sMins > cursor) {
          availableIntervals.push({ startMins: cursor, endMins: sMins });
        }
        cursor = Math.max(cursor, eMins);
      }
      if (cursor < TOTAL_DAY_MINS) {
        availableIntervals.push({ startMins: cursor, endMins: TOTAL_DAY_MINS });
      }

      return {
        station: st,
        bookedSlots: matchingSlots,
        availableIntervals,
      };
    });
  }, [bookedSlots, stations]);

  // General 24h timeline master segments (Available vs Booked)
  const masterTimeline = useMemo(() => {
    const sorted = [...bookedSlots].sort((a, b) => parseMins(a.start_time) - parseMins(b.start_time));
    const segments: {
      type: 'available' | 'booked';
      startMins: number;
      endMins: number;
      slot?: SlotInterval;
    }[] = [];

    let cursor = 0;
    for (const slot of sorted) {
      const sMins = parseMins(slot.start_time);
      const eMins = parseMins(slot.end_time);

      if (sMins > cursor) {
        segments.push({
          type: 'available',
          startMins: cursor,
          endMins: sMins,
        });
      }

      segments.push({
        type: 'booked',
        startMins: sMins,
        endMins: eMins,
        slot,
      });

      cursor = Math.max(cursor, eMins);
    }

    if (cursor < TOTAL_DAY_MINS) {
      segments.push({
        type: 'available',
        startMins: cursor,
        endMins: TOTAL_DAY_MINS,
      });
    }

    return segments;
  }, [bookedSlots]);

  // Convert minutes back to HH:MM string for slot selection
  const minsToTimeStr = (mins: number): string => {
    const clamped = Math.min(mins, 1439);
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Convert minutes to readable display label (e.g. "9:00 AM")
  const formatMinsDisplay = (mins: number): string => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // Check if user current selection has conflict
  const hasUserConflict = bookedSlots.some((slot) => {
    const sMins = parseMins(slot.start_time);
    const eMins = parseMins(slot.end_time);
    return Math.max(userStartMins, sMins) < Math.min(userEndMins, eMins);
  });

  return (
    <div className={`space-y-3 bg-white rounded-2xl border border-brand-mint-border shadow-xs p-4 sm:p-5 ${className}`}>
      
      {/* Top Header & Live Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-sm font-extrabold text-brand-dark">
              24-Hour Station & Slot Timeline
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-brand-mint text-brand-forest font-bold">
              {formatDisplayDate(selectedDate)}
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-0.5">
            Real-time occupancy across stations. Click any <strong className="text-emerald-700">green bar</strong> to instantly choose that shift.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-bold">
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Available Slot (Green)</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-red-50 text-red-800 border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Booked Slot (Red)</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Your Selection</span>
          </div>
        </div>
      </div>

      {/* TIMELINE CONTAINER (Scrollable on small devices) */}
      <div className="border border-gray-200 rounded-xl overflow-x-auto bg-white">
        <div className="min-w-[700px]">
          
          {/* Timeline Axis Header (Matching Admin Panel) */}
          <div className="grid grid-cols-12 bg-gray-50/90 border-b border-gray-200 text-[11px] font-bold text-gray-500 py-2.5 px-4 items-center select-none">
            <div className="col-span-3 text-left font-extrabold text-brand-dark">
              Station / Equipment
            </div>
            <div className="col-span-9 relative h-4">
              <div className="absolute inset-0 flex justify-between text-[10px] sm:text-[11px] text-gray-500 font-bold">
                <span>12 AM</span>
                <span>4 AM</span>
                <span>8 AM</span>
                <span>12 PM</span>
                <span>4 PM</span>
                <span>8 PM</span>
                <span>12 AM</span>
              </div>
            </div>
          </div>

          {/* Master 24-Hour Kitchen Hub Row */}
          <div className="grid grid-cols-12 items-center p-3 border-b border-gray-100 bg-brand-cream/40 hover:bg-brand-cream transition-colors">
            <div className="col-span-3 text-xs font-black text-brand-forest flex items-center gap-1.5 pr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-forest shrink-0" />
              <span className="truncate">Kitchen Availability</span>
            </div>

            <div className="col-span-9 relative h-10 flex items-center bg-gray-50 rounded-xl p-1 border border-gray-200/80 overflow-hidden">
              {/* Segments across 24h */}
              {masterTimeline.map((seg, idx) => {
                const leftPct = (seg.startMins / TOTAL_DAY_MINS) * 100;
                const widthPct = ((seg.endMins - seg.startMins) / TOTAL_DAY_MINS) * 100;

                if (seg.type === 'booked') {
                  const sTime = minsToTimeStr(seg.startMins);
                  const eTime = minsToTimeStr(seg.endMins);
                  return (
                    <div
                      key={`seg-${idx}`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      className="absolute top-1 bottom-1 bg-red-100/90 text-red-900 border border-red-300 rounded-lg px-2 flex items-center justify-between text-[11px] font-bold shadow-xs truncate select-none"
                      title={`Booked Slot: ${sTime} - ${eTime} (${seg.slot?.reason || 'Reserved Shift'})`}
                    >
                      <div className="flex items-center space-x-1 truncate">
                        <Lock className="w-3 h-3 text-red-700 shrink-0" />
                        <span className="truncate">
                          {seg.slot?.full_name || 'Booked'}: {formatDisplayTime(sTime)} – {formatDisplayTime(eTime)}
                        </span>
                      </div>
                    </div>
                  );
                }

                // Available segment (Green)
                const segDuration = Math.round((seg.endMins - seg.startMins) / 60);
                const sTime = minsToTimeStr(seg.startMins);
                return (
                  <button
                    key={`seg-${idx}`}
                    type="button"
                    onClick={() => onSelectSlot(sTime, Math.min(segDuration || 4, 4))}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className="absolute top-1 bottom-1 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-lg px-2 flex items-center justify-center text-[11px] font-bold cursor-pointer transition-all shadow-xs truncate group"
                    title={`Available: ${minsToTimeStr(seg.startMins)} - ${minsToTimeStr(seg.endMins)} (${segDuration}h open). Click to book!`}
                  >
                    <span className="truncate group-hover:scale-102 transition-transform">
                      🟢 Available ({formatDisplayTime(sTime)} · {segDuration}h free)
                    </span>
                  </button>
                );
              })}

              {/* User Selection Active Window Marker */}
              {userStartMins < TOTAL_DAY_MINS && (
                <div
                  style={{
                    left: `${(userStartMins / TOTAL_DAY_MINS) * 100}%`,
                    width: `${((Math.min(userEndMins, TOTAL_DAY_MINS) - userStartMins) / TOTAL_DAY_MINS) * 100}%`,
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded-lg border-2 pointer-events-none transition-all flex items-center justify-center text-[10px] font-black z-20 shadow-md ${
                    hasUserConflict
                      ? 'border-red-600 bg-red-500/25 text-red-950 animate-pulse'
                      : 'border-blue-600 bg-blue-500/20 text-blue-950'
                  }`}
                >
                  <span className="truncate px-1 bg-white/90 rounded text-[9px] shadow-xs">
                    {hasUserConflict ? '⚠️ Slot Conflict' : '✨ Your Slot'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Station Rows (Matching Admin Panel Screenshot) */}
          <div className="divide-y divide-gray-100 font-medium">
            {stationOccupancy.map(({ station, bookedSlots: stBooked, availableIntervals }, sIdx) => {
              return (
                <div
                  key={station.id}
                  className="grid grid-cols-12 items-center p-3 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Station Name with Color Dot */}
                  <div className="col-span-3 text-xs font-bold text-gray-800 flex items-center gap-2 pr-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${station.colorDot} shrink-0`} />
                    <span className="truncate">{station.name}</span>
                  </div>

                  {/* 24-Hour Station Bar Area */}
                  <div className="col-span-9 relative h-9 flex items-center bg-gray-50/70 rounded-lg p-0.5 border border-gray-200/60 overflow-hidden">
                    {/* Render Available blocks in Green */}
                    {availableIntervals.map((inv, aIdx) => {
                      const leftPct = (inv.startMins / TOTAL_DAY_MINS) * 100;
                      const widthPct = ((inv.endMins - inv.startMins) / TOTAL_DAY_MINS) * 100;
                      const sTime = minsToTimeStr(inv.startMins);
                      const invDuration = Math.round((inv.endMins - inv.startMins) / 60);

                      if (widthPct < 3) return null; // Skip micro slices

                      return (
                        <button
                          key={`avail-${sIdx}-${aIdx}`}
                          type="button"
                          onClick={() => onSelectSlot(sTime, Math.min(invDuration || 4, 4))}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className="absolute top-1 bottom-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-md px-1.5 flex items-center justify-center text-[10px] sm:text-[11px] font-bold cursor-pointer transition-colors truncate shadow-2xs"
                          title={`${station.name} Available from ${minsToTimeStr(inv.startMins)} to ${minsToTimeStr(inv.endMins)}. Click to select shift!`}
                        >
                          <span className="truncate">Available</span>
                        </button>
                      );
                    })}

                    {/* Render Booked blocks in Red / Colored Pills (Exact match to admin panel!) */}
                    {stBooked.map((slot, bIdx) => {
                      const sMins = parseMins(slot.start_time);
                      const eMins = parseMins(slot.end_time);
                      const leftPct = (sMins / TOTAL_DAY_MINS) * 100;
                      const widthPct = ((eMins - sMins) / TOTAL_DAY_MINS) * 100;

                      const clientName = slot.full_name || slot.reference || 'Reserved';
                      const startTimeDisp = formatDisplayTime(slot.start_time);
                      const endTimeDisp = formatDisplayTime(slot.end_time);

                      return (
                        <div
                          key={`booked-${sIdx}-${bIdx}`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className="absolute top-1 bottom-1 bg-red-100/95 hover:bg-red-200 text-red-950 border border-red-300 rounded-md px-2 flex items-center justify-between text-[11px] font-bold truncate transition-colors shadow-xs z-10"
                          title={`${clientName} · ${startTimeDisp} – ${endTimeDisp} (${slot.reason || 'Booked Slot'})`}
                        >
                          <span className="truncate">
                            {clientName} · {startTimeDisp} – {endTimeDisp}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Bottom Summary Bar for Selected Slot */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 px-1 text-xs">
        <div className="flex items-center space-x-2 text-brand-dark">
          <Clock className="w-4 h-4 text-brand-forest shrink-0" />
          <span>
            Requested Time Window:{' '}
            <strong className="text-brand-forest">
              {formatDisplayTime(startTime)} – {formatDisplayTime(minsToTimeStr(userEndMins))} ({duration} Hours)
            </strong>
          </span>
        </div>

        {hasUserConflict ? (
          <div className="text-red-700 font-bold flex items-center space-x-1.5 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Time overlaps with a red booked slot! Please pick an open green window.</span>
          </div>
        ) : (
          <div className="text-emerald-700 font-bold flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Slot is open & unreserved on this date</span>
          </div>
        )}
      </div>

    </div>
  );
};
