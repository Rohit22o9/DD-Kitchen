import React, { useEffect, useState } from 'react';
import { KeyRound, MailCheck, X } from 'lucide-react';
import { api } from '../../services/api';
import type { User } from '../../types';

/**
 * Handles links from emails:
 *   #reset-password?token=…  -> choose a new password
 *   #verify-email?token=…    -> confirm the email address
 */
export const AccountLinks: React.FC<{ onSignedIn?: (u: User) => void }> = ({ onSignedIn }) => {
  const [mode, setMode] = useState<'reset' | 'verify' | null>(null);
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/^#(reset-password|verify-email)\?token=([a-f0-9]{64})/);
      if (!m) return;
      setToken(m[2]);
      setMode(m[1] === 'reset-password' ? 'reset' : 'verify');
      setMessage(null);
      setError(null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  useEffect(() => {
    if (mode !== 'verify' || !token) return;
    setBusy(true);
    api
      .verifyEmail(token)
      .then((u) => {
        setMessage(`Thanks — ${u.email} is confirmed. You can now book.`);
        if (api.getCurrentUser()?.email === u.email) onSignedIn?.(u);
      })
      .catch((e: any) => setError(e.message || 'This link is invalid or expired.'))
      .finally(() => setBusy(false));
  }, [mode, token, onSignedIn]);

  const close = () => {
    setMode(null);
    history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The passwords do not match.');
    setBusy(true);
    try {
      const res = await api.resetPassword(token, password);
      if (res.user && api.getCurrentUser()) {
        setMessage('Password changed. You are signed in.');
        onSignedIn?.(res.user);
      } else {
        setMessage(res.message || 'Password changed. You can now log in.');
      }
    } catch (err: any) {
      setError(err.message || 'Could not reset your password.');
    } finally {
      setBusy(false);
    }
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-sm relative">
        <button type="button" onClick={close} className="absolute top-3 right-3 p-1 text-gray-400 cursor-pointer" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 font-bold text-gray-900">
          {mode === 'reset' ? <KeyRound className="w-5 h-5" /> : <MailCheck className="w-5 h-5" />}
          <span>{mode === 'reset' ? 'Choose a new password' : 'Confirming your email'}</span>
        </div>
        {message ? (
          <>
            <p className="text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{message}</p>
            <button type="button" onClick={close} className="w-full py-2.5 rounded-xl bg-[#112F21] text-white font-bold cursor-pointer">
              Continue
            </button>
          </>
        ) : mode === 'reset' ? (
          <form onSubmit={submitReset} className="space-y-3">
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (8+ characters)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300"
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300"
              required
            />
            {error && <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl p-2 text-xs">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-xl bg-[#112F21] text-white font-bold disabled:opacity-50 cursor-pointer">
              {busy ? 'Saving…' : 'Save new password'}
            </button>
          </form>
        ) : (
          <p className="text-gray-600">{busy ? 'One moment…' : error}</p>
        )}
      </div>
    </div>
  );
};
