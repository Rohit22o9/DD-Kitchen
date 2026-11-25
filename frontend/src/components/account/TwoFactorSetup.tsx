import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  scope: 'user' | 'admin' | 'superadmin';
  onDone: () => void;
  onCancel?: () => void;
}

/** Enrol an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy). */
export const TwoFactorSetup: React.FC<Props> = ({ scope, onDone, onCancel }) => {
  const [secret, setSecret] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [otpUrl, setOtpUrl] = useState<string>('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .twoFactorSetup(scope)
      .then(async (r) => {
        if (!active) return;
        setSecret(r.secret);
        setOtpUrl(r.otpauth_url);
        setQr(await QRCode.toDataURL(r.otpauth_url, { margin: 1, width: 200 }));
      })
      .catch((e: any) => active && setError(e.message || 'Could not start two-factor setup.'));
    return () => {
      active = false;
    };
  }, [scope]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.twoFactorEnable(scope, code.trim());
      onDone();
    } catch (err: any) {
      setError(err.message || 'That code did not work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-6 shadow-xl space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#112F21]" />
        <h3 className="font-bold text-base text-gray-900">Set up two-factor authentication</h3>
      </div>
      <p className="text-gray-600">
        Staff accounts need a code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password or Authy) each time
        they sign in.
      </p>
      <ol className="list-decimal list-inside space-y-1 text-gray-700">
        <li>Open your authenticator app and add an account.</li>
        <li>Scan the QR code, or on this phone tap “Open in app”, or type the key.</li>
        <li>Enter the 6-digit code it shows.</li>
      </ol>
      {qr ? (
        <div className="flex flex-col items-center gap-2">
          <img src={qr} alt="Two-factor QR code" className="w-44 h-44 border border-gray-200 rounded-xl" />
          <a href={otpUrl} className="text-[#112F21] font-bold underline">
            Open in app
          </a>
          <div className="font-mono text-[11px] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 break-all select-all">{secret}</div>
        </div>
      ) : (
        !error && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )
      )}
      <form onSubmit={submit} className="space-y-3">
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="6-digit code"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-center font-mono text-base tracking-widest"
          required
        />
        {error && <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-300 font-bold cursor-pointer">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={busy || code.length !== 6 || !secret}
            className="flex-1 py-2.5 rounded-xl bg-[#112F21] text-white font-bold disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Checking…' : 'Turn on two-factor'}
          </button>
        </div>
      </form>
    </div>
  );
};
