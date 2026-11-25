import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api, formatMoney } from '../../services/api';
import type { Invoice } from '../../types';

const Shell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} className="p-1 text-gray-400 cursor-pointer" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/** Refund part or all of a paid invoice. Issues an ATO adjustment note. */
export const RefundDialog: React.FC<{ invoice: Invoice; onClose: () => void; onDone: (inv: Invoice, note: string) => void }> = ({ invoice, onClose, onDone }) => {
  const refundable = Math.round((invoice.total_amount - (invoice.refunded_amount || 0)) * 100) / 100;
  const [amount, setAmount] = useState(String(refundable));
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [cancel, setCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Shell title={`Refund ${invoice.invoice_number}`} onClose={onClose}>
      <p className="text-gray-600">
        Up to <b>{formatMoney(refundable)}</b> (inc GST) can be refunded. An adjustment note is issued and GST is reduced in proportion. Refund
        the bond separately under Security bonds.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const r = await api.refundInvoice(invoice.invoice_number, {
              amount: Number(amount),
              reason,
              reference: reference || undefined,
              cancel_booking: cancel,
            });
            onDone(r.invoice, r.adjustment_note.note_number);
          } catch (err: any) {
            setError(err.message || 'Refund failed.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block space-y-1">
          <span className="font-bold text-gray-700">Amount to refund (inc GST)</span>
          <input type="number" step="0.01" min="0.01" max={refundable} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono" required />
        </label>
        <label className="block space-y-1">
          <span className="font-bold text-gray-700">Reason (shown to the customer)</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} minLength={3} maxLength={500} className="w-full px-3 py-2 rounded-xl border border-gray-300" required />
        </label>
        <label className="block space-y-1">
          <span className="font-bold text-gray-700">Bank transfer reference (optional)</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={cancel} onChange={(e) => setCancel(e.target.checked)} />
          <span>Also cancel the booking and free the time slot</span>
        </label>
        {error && <p className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer disabled:opacity-50">
          {busy ? 'Issuing…' : 'Issue refund & adjustment note'}
        </button>
      </form>
    </Shell>
  );
};

/** Return the bond after inspection, optionally keeping part of it (with a reason). */
export const BondDialog: React.FC<{ invoice: Invoice; onClose: () => void; onDone: (inv: Invoice) => void }> = ({ invoice, onClose, onDone }) => {
  const bond = invoice.security_deposit;
  const [keep, setKeep] = useState('0');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kept = Math.min(bond, Math.max(0, Number(keep) || 0));

  return (
    <Shell title={`Settle bond — ${invoice.booking_reference || invoice.invoice_number}`} onClose={onClose}>
      <p className="text-gray-600">
        Bond held: <b>{formatMoney(bond)}</b>. Any amount kept becomes income and includes GST of 1/11.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            const r = await api.settleBond(invoice.invoice_number, {
              refund_amount: Math.round((bond - kept) * 100) / 100,
              forfeit_amount: kept,
              reason: reason || undefined,
              reference: reference || undefined,
            });
            onDone(r.invoice);
          } catch (err: any) {
            setError(err.message || 'Could not settle the bond.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block space-y-1">
          <span className="font-bold text-gray-700">Amount to keep (e.g. cleaning or damage)</span>
          <input type="number" step="0.01" min="0" max={bond} value={keep} onChange={(e) => setKeep(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono" />
        </label>
        {kept > 0 && (
          <label className="block space-y-1">
            <span className="font-bold text-gray-700">Reason for keeping it (shown to the customer)</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300" required />
          </label>
        )}
        <label className="block space-y-1">
          <span className="font-bold text-gray-700">Bank transfer reference (optional)</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
        </label>
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex justify-between">
            <span>Refund to customer</span>
            <b className="font-mono">{formatMoney(bond - kept)}</b>
          </div>
          <div className="flex justify-between">
            <span>Kept (GST {formatMoney(Math.round((kept / 11) * 100) / 100)})</span>
            <b className="font-mono">{formatMoney(kept)}</b>
          </div>
        </div>
        {error && <p className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer disabled:opacity-50">
          {busy ? 'Saving…' : 'Settle bond'}
        </button>
      </form>
    </Shell>
  );
};
