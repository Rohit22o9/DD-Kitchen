import React, { useState } from 'react';
import { FileUp, KeyRound, MailCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import type { User } from '../../types';

interface Props {
  user: User;
  onUserChange: (u: User) => void;
}

const DOCS: { kind: 'food_safety_cert' | 'liability_insurance'; label: string; field: 'food_safety_cert_name' | 'liability_insurance_name' }[] = [
  { kind: 'food_safety_cert', label: 'Food Safety Supervisor certificate', field: 'food_safety_cert_name' },
  { kind: 'liability_insurance', label: 'Public liability insurance', field: 'liability_insurance_name' },
];

/** Customer account security: email confirmation, password change, compliance documents. */
export const AccountSecurityPanel: React.FC<Props> = ({ user, onUserChange }) => {
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    setNote(null);
    try {
      setNote({ ok: true, text: await fn() });
    } catch (err: any) {
      setNote({ ok: false, text: err.message || 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-6 text-xs">
      <h3 className="font-bold text-sm text-gray-900">Account security & documents</h3>
      {note && (
        <div className={`p-3 rounded-xl border ${note.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {note.text}
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <MailCheck className="w-4 h-4" /> Email address
        </div>
        {user.email_verified ? (
          <p className="text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> {user.email} is confirmed.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-amber-800">{user.email} is not confirmed yet.</span>
            <button
              type="button"
              disabled={busy === 'verify'}
              onClick={() => run('verify', async () => (await api.resendVerification()).message)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 font-bold cursor-pointer disabled:opacity-50"
            >
              Resend confirmation email
            </button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <FileUp className="w-4 h-4" /> Compliance documents (PDF, JPG or PNG, max 5 MB)
        </div>
        {DOCS.map((d) => (
          <div key={d.kind} className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-xl p-3">
            <div>
              <div className="font-semibold text-gray-800">{d.label}</div>
              <div className="text-gray-500">{user[d.field] ? `On file: ${user[d.field]}` : 'Not uploaded'}</div>
            </div>
            <label className="px-3 py-1.5 rounded-lg bg-[#112F21] text-white font-bold cursor-pointer">
              {busy === d.kind ? 'Uploading…' : user[d.field] ? 'Replace' : 'Upload'}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  run(d.kind, async () => {
                    const u = await api.uploadDocument(d.kind, file);
                    onUserChange(u);
                    return `${d.label} uploaded.`;
                  });
                }}
              />
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2 font-bold text-gray-800">
          <KeyRound className="w-4 h-4" /> Change password
        </div>
        <form
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run('password', async () => {
              if (next.length < 8) throw new Error('Use at least 8 characters.');
              const u = await api.changePassword(current, next);
              onUserChange(u);
              setCurrent('');
              setNext('');
              return 'Password changed. Other devices have been signed out.';
            });
          }}
        >
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            className="px-3 py-2 rounded-xl border border-gray-300"
            required
          />
          <input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="New password (8+)"
            className="px-3 py-2 rounded-xl border border-gray-300"
            required
          />
          <button type="submit" disabled={busy === 'password'} className="py-2 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer disabled:opacity-50">
            {busy === 'password' ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  );
};
