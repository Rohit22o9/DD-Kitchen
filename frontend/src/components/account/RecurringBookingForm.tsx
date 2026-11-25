import React, { useState } from 'react';
import { api, perthToday, addDaysToDate, formatDisplayDate } from '../../services/api';
import type { Booking, KitchenConfig, User } from '../../types';

interface Props {
  user: User;
  config?: KitchenConfig | null;
  onCreated: (bookings: Booking[]) => void;
  onClose: () => void;
}

const TIMES = ['06:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

/** Book the same shift weekly or fortnightly. Each date is a normal booking, paid separately. */
export const RecurringBookingForm: React.FC<Props> = ({ user, config, onCreated, onClose }) => {
  const durations = (config?.packages || []).map((p) => p.hours);
  const [date, setDate] = useState(addDaysToDate(perthToday(), 1));
  const [time, setTime] = useState('09:00');
  const [hours, setHours] = useState<number>(durations.includes(4) ? 4 : durations[0] || 4);
  const [frequency, setFrequency] = useState<'weekly' | 'fortnightly'>('weekly');
  const [occurrences, setOccurrences] = useState(4);
  const [use, setUse] = useState('Commercial food production');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: Booking[]; skipped: { booking_date: string; reason: string }[] } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api.createRecurring({
        booking_date: date,
        start_time: time,
        duration_hours: hours,
        frequency,
        occurrences,
        phone: user.phone || '',
        intended_use: use,
      });
      setResult(r);
      onCreated(r.created);
    } catch (err: any) {
      setError(err.message || 'Could not create the series.');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-3 text-xs">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <div className="font-bold text-sm mb-1">{result.created.length} booking(s) requested</div>
          <ul className="list-disc list-inside">
            {result.created.map((b) => (
              <li key={b.reference_code}>
                {formatDisplayDate(b.booking_date)} {b.start_time} — <span className="font-mono">{b.reference_code}</span>
              </li>
            ))}
          </ul>
        </div>
        {result.skipped.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <div className="font-bold mb-1">Skipped (already taken or not bookable)</div>
            <ul className="list-disc list-inside">
              {result.skipped.map((s) => (
                <li key={s.booking_date}>
                  {formatDisplayDate(s.booking_date)}: {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-gray-600">Each date is held for you until paid. Payment details are on each booking.</p>
        <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer">
          Done
        </button>
      </div>
    );
  }

  const phoneMissing = !user.phone;

  return (
    <form onSubmit={submit} className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="font-bold text-gray-700">First date</span>
          <input type="date" min={perthToday()} value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200" required />
        </label>
        <label className="space-y-1">
          <span className="font-bold text-gray-700">Start (AWST)</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200">
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-bold text-gray-700">Hours</span>
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-200">
            {(durations.length ? durations : [2, 4, 8, 12]).map((h) => (
              <option key={h} value={h}>
                {h} hours
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-bold text-gray-700">Repeat</span>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as 'weekly' | 'fortnightly')} className="w-full px-3 py-2 rounded-xl border border-gray-200">
            <option value="weekly">Every week</option>
            <option value="fortnightly">Every 2 weeks</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="font-bold text-gray-700">Number of shifts</span>
          <input type="number" min={2} max={12} value={occurrences} onChange={(e) => setOccurrences(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-gray-200" />
        </label>
        <label className="space-y-1">
          <span className="font-bold text-gray-700">What you'll make</span>
          <input value={use} onChange={(e) => setUse(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200" maxLength={200} />
        </label>
      </div>
      {phoneMissing && <p className="text-amber-800">Add a phone number to your profile first.</p>}
      {error && <p className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</p>}
      <p className="text-gray-500">By booking you accept the Terms & Conditions. Taken dates are skipped, not double-booked.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold cursor-pointer">
          Cancel
        </button>
        <button type="submit" disabled={busy || phoneMissing} className="flex-1 py-2.5 rounded-xl bg-[#ED8533] text-white font-bold cursor-pointer disabled:opacity-50">
          {busy ? 'Booking…' : `Book ${occurrences} shifts`}
        </button>
      </div>
    </form>
  );
};
