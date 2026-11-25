import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { api, formatMoney } from '../../services/api';
import type { BankReconcileResult } from '../../types';

const LABELS: Record<string, string> = {
  match: 'Ready to record',
  recorded: 'Recorded as paid',
  already_paid: 'Already paid',
  amount_mismatch: 'Amount differs — check',
  unknown_reference: 'Reference not found',
  unmatched: 'No reference in description',
  needs_review: 'Needs review',
};

/**
 * Upload a bank statement CSV exported from internet banking. Payments whose
 * description contains a booking reference and the exact amount are matched;
 * staff review the list, then record them in one click.
 */
export const BankImport: React.FC<{ onClose: () => void; onApplied: () => void }> = ({ onClose, onApplied }) => {
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<BankReconcileResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (text: string, apply: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.reconcileBank(text, apply);
      setResult(r);
      if (apply) onApplied();
    } catch (err: any) {
      setError(err.message || 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-xs my-8">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900">Import bank statement</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600">
          In your internet banking, export recent transactions as <b>CSV</b>, then choose the file here. Incoming payments whose
          description includes a booking reference (DD-BK-… or DD-ST-…) and the exact amount owed are matched. Nothing is recorded
          until you press <b>Record matched payments</b>.
        </p>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-5 cursor-pointer hover:bg-gray-50">
          <Upload className="w-4 h-4" />
          <span className="font-bold">{fileName || 'Choose CSV file'}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              if (f.size > 2_000_000) return setError('That file is over 2 MB. Export a shorter date range.');
              const text = await f.text();
              setFileName(f.name);
              setCsv(text);
              run(text, false);
            }}
          />
        </label>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>}
        {result && (
          <>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-lg bg-gray-100">{result.summary.credits} incoming payments</span>
              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900">{result.summary.matched} ready</span>
              {result.summary.recorded > 0 && <span className="px-2 py-1 rounded-lg bg-emerald-700 text-white">{result.summary.recorded} recorded</span>}
              <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900">{result.summary.amount_mismatch} amount differs</span>
              <span className="px-2 py-1 rounded-lg bg-gray-100">{result.summary.unmatched} unmatched</span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-600 sticky top-0">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-right">Received</th>
                    <th className="p-2 text-right">Owed</th>
                    <th className="p-2">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.results.map((r) => (
                    <tr key={r.line}>
                      <td className="p-2 whitespace-nowrap">{r.date || '—'}</td>
                      <td className="p-2">
                        <div className="truncate max-w-[260px]" title={r.description}>
                          {r.description}
                        </div>
                        {r.reference && <div className="font-mono text-emerald-800">{r.reference}</div>}
                      </td>
                      <td className="p-2 text-right font-mono">{formatMoney(r.amount)}</td>
                      <td className="p-2 text-right font-mono">{r.expected !== null ? formatMoney(r.expected) : '—'}</td>
                      <td className="p-2 font-bold">{LABELS[r.status] || r.status.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 font-bold cursor-pointer">
                Close
              </button>
              <button
                type="button"
                disabled={busy || !csv || result.summary.matched === 0}
                onClick={() => csv && run(csv, true)}
                className="px-4 py-2 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? 'Working…' : `Record ${result.summary.matched} matched payment(s)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
