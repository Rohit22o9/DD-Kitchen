import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Mail, Phone, Search } from 'lucide-react';
import { api } from '../../services/api';
import type { Booking, User } from '../../types';

/** Registered hirer accounts with their compliance documents. */
export const CustomerDirectory: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .getAdminUsers(search || undefined)
        .then(setUsers)
        .catch((e: any) => setError(e.message || 'Could not load customers.'));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    bookings.forEach((b) => m.set(String(b.user_id || b.email), (m.get(String(b.user_id || b.email)) || 0) + 1));
    return m;
  }, [bookings]);

  const open = async (userId: string, kind: 'food_safety_cert' | 'liability_insurance') => {
    try {
      await api.openAdminDocument(userId, kind);
    } catch (e: any) {
      setError(e.message || 'Could not open the document.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-gray-900">Customer accounts</h3>
          <p className="text-gray-500 mt-0.5">Registered hirers, their compliance documents and booking counts</p>
        </div>
        <label className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, business" className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 w-64" />
        </label>
      </div>
      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div key={String(u.id)} className="p-4 rounded-xl border border-gray-200 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-sm text-gray-900">{u.full_name}</div>
                <div className="text-gray-500">{u.business_name || '—'}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.email_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {u.email_verified ? 'Email confirmed' : 'Email unconfirmed'}
              </span>
            </div>
            <div className="space-y-1 text-gray-600">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate">{u.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{u.phone || '—'}</span>
              </div>
              <div>
                ABN: <span className="font-mono">{u.abn || 'not provided'}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-2">
              {([
                ['food_safety_cert', 'Food safety cert', u.food_safety_cert_name],
                ['liability_insurance', 'Insurance', u.liability_insurance_name],
              ] as const).map(([kind, label, name]) =>
                name ? (
                  <button key={kind} type="button" onClick={() => open(String(u.id), kind)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 font-bold cursor-pointer">
                    <FileText className="w-3.5 h-3.5" /> {label}
                  </button>
                ) : (
                  <span key={kind} className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                    {label}: missing
                  </span>
                )
              )}
              <span className="ml-auto text-gray-400">{counts.get(String(u.id)) || 0} bookings</span>
            </div>
          </div>
        ))}
        {users.length === 0 && !error && <p className="text-gray-500">No customer accounts found.</p>}
      </div>
    </div>
  );
};
