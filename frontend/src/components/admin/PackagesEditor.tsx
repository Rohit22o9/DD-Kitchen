import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import type { KitchenConfig, KitchenPackage } from '../../types';

/** Edit the kitchen hire packages (prices ex GST). The website and the server both price from these. */
export const PackagesEditor: React.FC<{ config: KitchenConfig | null; onSaved: (c: KitchenConfig) => void }> = ({ config, onSaved }) => {
  const [rows, setRows] = useState<KitchenPackage[]>(() => (config?.packages || []).map((p) => ({ ...p })));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (i: number, patch: Partial<KitchenPackage>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  const save = async () => {
    setBusy(true);
    setNote(null);
    try {
      const clean = rows
        .filter((r) => r.hours > 0)
        .map((r) => ({ hours: Number(r.hours), price: Number(r.price), label: r.label || `${r.hours}-hour shift` }))
        .sort((a, b) => a.hours - b.hours);
      if (new Set(clean.map((r) => r.hours)).size !== clean.length) throw new Error('Each package needs a different number of hours.');
      const updated = await api.updateAdminConfig(undefined, { packages: clean });
      onSaved(updated);
      setRows(updated.packages || clean);
      setNote({ ok: true, text: 'Packages saved. New bookings use these prices immediately.' });
    } catch (err: any) {
      setNote({ ok: false, text: err.message || 'Could not save packages.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4 text-xs">
      <div>
        <h3 className="font-bold text-sm text-gray-900">Kitchen hire packages</h3>
        <p className="text-gray-500">Prices are ex GST (10% is added). Durations not listed are charged at the hourly rate.</p>
      </div>
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase text-gray-500">
          <tr>
            <th className="py-1">Hours</th>
            <th className="py-1">Price ex GST ($)</th>
            <th className="py-1">Name</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-1 pr-2">
                <input type="number" min={0.5} max={24} step={0.5} value={r.hours} onChange={(e) => update(i, { hours: Number(e.target.value) })} className="w-20 px-2 py-1.5 rounded-lg border border-gray-200" />
              </td>
              <td className="py-1 pr-2">
                <input type="number" min={0} step={0.01} value={r.price} onChange={(e) => update(i, { price: Number(e.target.value) })} className="w-28 px-2 py-1.5 rounded-lg border border-gray-200 font-mono" />
              </td>
              <td className="py-1 pr-2">
                <input value={r.label || ''} onChange={(e) => update(i, { label: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-gray-200" maxLength={80} />
              </td>
              <td className="py-1 text-right">
                <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="p-1.5 text-red-600 cursor-pointer" aria-label="Remove package">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setRows((r) => [...r, { hours: 6, price: 0, label: '' }])} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-300 font-bold cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Add package
        </button>
        <button type="button" onClick={save} disabled={busy} className="px-4 py-2 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer disabled:opacity-50">
          {busy ? 'Saving…' : 'Save packages'}
        </button>
      </div>
      {note && <div className={`p-3 rounded-xl border ${note.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>{note.text}</div>}
    </div>
  );
};
