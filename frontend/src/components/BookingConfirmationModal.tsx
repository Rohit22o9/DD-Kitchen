import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Calendar,
  X,
  AlertCircle,
  Mail,
  Copy,
  Check,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { Booking, PaymentDetails } from '../types';
import { api } from '../services/api';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
  onGoToPortal?: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
  onGoToPortal,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);
  const [pay, setPay] = useState<PaymentDetails | null>(null);
  useEffect(() => {
    api.getConfig().then((c) => setPay(c.payment_details || null)).catch(() => setPay(null));
  }, []);

  if (!booking) return null;
  const amountPayable = booking.amount_payable ?? booking.total_price + (booking.security_deposit || 0);

  const copyToClipboard = (text: string, type: 'ref' | 'bank') => {
    navigator.clipboard.writeText(text);
    if (type === 'ref') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  // Generate downloadable .ics calendar file
  const downloadICS = () => {
    const toICS = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const startIso = booking.start_at || `${booking.booking_date}T${booking.start_time}:00+08:00`;
    const endIso = booking.end_at || new Date(Date.parse(startIso) + booking.duration_hours * 3600000).toISOString();
    const startICS = toICS(startIso);
    const endICS = toICS(endIso);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daily Drop Kitchen//Rental Platform//EN',
      'BEGIN:VEVENT',
      `UID:${booking.reference_code}@dailydrop.today`,
      `DTSTAMP:${toICS(new Date().toISOString())}`,
      `DTSTART:${startICS}`,
      `DTEND:${endICS}`,
      `SUMMARY:Daily Drop Commercial Kitchen Rental (${booking.reference_code})`,
      `DESCRIPTION:Commercial kitchen reservation for ${booking.intended_use}. Reference: ${booking.reference_code}. Slot confirmed after payment.`,
      'LOCATION:Unit 1, 1 Lichfield Street, Victoria Park, Perth, WA, 6101',
      'STATUS:TENTATIVE',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DailyDrop-Kitchen-${booking.reference_code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-brand-mint-border relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close confirmation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center pb-5 border-b border-gray-100">
          <div className="w-14 h-14 rounded-2xl bg-brand-mint text-brand-forest flex items-center justify-center mx-auto mb-3 shadow-soft-sm">
            <CheckCircle className="w-8 h-8 text-brand-forest" />
          </div>

          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-brand-orange mb-1">
            Booking Received
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Thank You, {booking.full_name}!
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted mt-1.5 max-w-md mx-auto">
            Your commercial kitchen rental slot has been placed on hold.
          </p>
        </div>

        {/* 1. Automated Email Confirmation Notification Pill */}
        <div className="my-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start sm:items-center space-x-3 text-emerald-900 text-xs sm:text-sm shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-emerald-900">Confirmation Email Sent!</p>
            <p className="text-emerald-800 text-xs mt-0.5">
              We have dispatched a full booking summary & payment instructions to <strong className="font-semibold underline decoration-emerald-400">{booking.email}</strong>.
            </p>
          </div>
        </div>

        {/* 2. CRITICAL NOTICE: PAYMENT REQUIRED BEFORE SLOT IS CONFIRMED */}
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-sm text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>Payment Required to Book Your Slot</span>
              </h4>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-1 leading-relaxed">
                Your requested time slot is currently on <strong>temporary hold</strong>. 
                <span className="font-bold text-amber-950"> You need to complete your payment first. After payment is received, the slot will be officially booked</span> and your 6-digit electronic keypad entry PIN will be generated.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Reference Code Bar */}
        <div className="mb-5 p-4 rounded-2xl bg-brand-cream/80 border border-brand-mint-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Your Booking Reference Number
            </span>
            <div className="text-2xl font-black text-brand-forest tracking-wider font-mono">
              {booking.reference_code}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(booking.reference_code, 'ref')}
              className="text-xs px-3 py-1.5 rounded-lg border border-brand-forest/30 bg-white hover:bg-brand-mint text-brand-forest font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRef ? 'Copied!' : 'Copy Reference'}</span>
            </button>
            <span className="text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              ● Awaiting Payment
            </span>
          </div>
        </div>

        {/* 4. Payment Transfer Details Box */}
        <div className="mb-5 rounded-2xl border border-brand-mint-border bg-[#FBFDFB] p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2 text-brand-forest font-extrabold text-sm">
              <CreditCard className="w-4 h-4 text-brand-orange" />
              <span>How to Pay (Direct Bank Transfer / PayID)</span>
            </div>
            {pay && (
              <button
                onClick={() => {
                  const bankInfo = [
                    pay.bank_name && `Bank: ${pay.bank_name}`,
                    pay.account_name && `Account Name: ${pay.account_name}`,
                    pay.bsb && `BSB: ${pay.bsb}`,
                    pay.account_number && `Account Number: ${pay.account_number}`,
                    pay.payid && `PayID: ${pay.payid}`,
                    `Reference: ${booking.reference_code}`,
                    `Amount: $${amountPayable.toFixed(2)} AUD`,
                  ]
                    .filter(Boolean)
                    .join('\n');
                  copyToClipboard(bankInfo, 'bank');
                }}
                className="text-xs text-brand-forest font-bold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBank ? 'Copied Bank Details!' : 'Copy All Details'}</span>
              </button>
            )}
          </div>

          {pay ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
              {pay.bank_name && (
                <div>
                  <span className="text-gray-500">Bank:</span>
                  <p className="font-bold text-brand-dark">{pay.bank_name}</p>
                </div>
              )}
              {pay.account_name && (
                <div>
                  <span className="text-gray-500">Account Name:</span>
                  <p className="font-bold text-brand-dark">{pay.account_name}</p>
                </div>
              )}
              {pay.bsb && (
                <div>
                  <span className="text-gray-500">BSB:</span>
                  <p className="font-mono font-bold text-brand-dark text-sm">{pay.bsb}</p>
                </div>
              )}
              {pay.account_number && (
                <div>
                  <span className="text-gray-500">Account Number:</span>
                  <p className="font-mono font-bold text-brand-dark text-sm">{pay.account_number}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Required Description / Reference:</span>
                <p className="font-mono font-extrabold text-brand-forest bg-brand-mint px-2 py-0.5 rounded w-fit text-sm">
                  {booking.reference_code}
                </p>
              </div>
              {pay.payid && (
                <div>
                  <span className="text-gray-500">Or pay via PayID:</span>
                  <p className="font-bold text-brand-dark">{pay.payid}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="pt-3 text-xs text-gray-600">
              Daily Drop will email you payment details with your tax invoice. Quote reference{' '}
              <span className="font-mono font-bold">{booking.reference_code}</span> when paying.
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rental (inc. 10% GST):</span>
              <span className="font-mono font-semibold">${booking.total_price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Refundable security bond (no GST):</span>
              <span className="font-mono font-semibold">${(booking.security_deposit || 0).toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">Total to transfer:</span>
            <span className="font-black text-base text-brand-forest font-mono">${amountPayable.toFixed(2)} AUD</span>
          </div>
        </div>

        {/* 5. Session Summary Table */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 space-y-2 text-xs mb-5">
          <h4 className="font-bold text-brand-dark text-[11px] uppercase tracking-wider mb-2">
            Reserved Session Summary
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Rental Date:</span>
              <p className="font-bold text-brand-dark">{booking.booking_date}</p>
            </div>
            <div>
              <span className="text-gray-500">Reserved Hours:</span>
              <p className="font-bold text-brand-dark">
                {booking.start_time} – {booking.end_time} ({booking.duration_hours} hrs)
              </p>
            </div>
            <div>
              <span className="text-gray-500">Facility Access:</span>
              <p className="font-bold text-emerald-800">All-Inclusive Kitchen Equipment</p>
            </div>
            <div>
              <span className="text-gray-500">Intended Purpose:</span>
              <p className="font-bold text-brand-dark truncate">{booking.intended_use}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={downloadICS}
            className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-soft transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Add Hold to Calendar (.ics)</span>
          </button>

          {onGoToPortal && (
            <button
              onClick={() => {
                onClose();
                onGoToPortal();
              }}
              className="flex-1 bg-brand-orange hover:bg-brand-orange-hover text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-soft transition-colors cursor-pointer"
            >
              <span>View in Customer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-50 text-brand-dark border border-gray-300 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors text-center cursor-pointer"
          >
            Close & Return to Home
          </button>
        </div>

      </div>
    </div>
  );
};
