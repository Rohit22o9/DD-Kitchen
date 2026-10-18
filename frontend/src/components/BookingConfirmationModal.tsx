import React from 'react';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Download, 
  Share2, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  ChefHat, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { Booking } from '../types';

interface BookingConfirmationModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  booking,
  onClose,
}) => {
  if (!booking) return null;

  // Generate downloadable .ics calendar file
  const downloadICS = () => {
    const [startH, startM] = booking.start_time.split(':').map(Number);
    const [endH, endM] = booking.end_time.split(':').map(Number);
    const [year, month, day] = booking.booking_date.split('-').map(Number);

    const formatICSDate = (y: number, m: number, d: number, hr: number, min: number) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${y}${pad(m)}${pad(d)}T${pad(hr)}${pad(min)}00`;
    };

    const startICS = formatICSDate(year, month, day, startH, startM);
    const endICS = formatICSDate(year, month, day, endH, endM);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Daily Drop Kitchen//Rental Platform//EN',
      'BEGIN:VEVENT',
      `UID:${booking.reference_code}@dailydrop.com.au`,
      `DTSTAMP:${startICS}Z`,
      `DTSTART:${startICS}`,
      `DTEND:${endICS}`,
      `SUMMARY:Daily Drop Commercial Kitchen Rental (${booking.reference_code})`,
      `DESCRIPTION:Commercial kitchen reservation for ${booking.intended_use}. Team of ${booking.team_size}. Reference: ${booking.reference_code}`,
      'LOCATION:876 Albany Hwy, East Victoria Park, Perth WA 6101',
      'STATUS:CONFIRMED',
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

  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-9 shadow-2xl border border-brand-mint-border relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-colors"
          aria-label="Close confirmation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="text-center pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-brand-mint text-brand-forest flex items-center justify-center mx-auto mb-3 shadow-soft-sm">
            <CheckCircle className="w-8 h-8 text-brand-forest" />
          </div>

          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand-orange mb-1">
            Booking Request Received
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-brand-dark tracking-tight">
            Thank You, {booking.full_name}!
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted mt-2 max-w-md mx-auto">
            Your booking request has been registered in our reservation queue.
          </p>
        </div>

        {/* Reference Code Box */}
        <div className="my-6 p-4 rounded-2xl bg-brand-cream/80 border border-brand-mint-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Booking Reference Number
            </span>
            <div className="text-2xl font-black text-brand-forest tracking-wider font-mono">
              {booking.reference_code}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
              ● {booking.status.toUpperCase()} REVIEW
            </span>
          </div>
        </div>

        {/* Official Status Notice as per Prompt Instructions */}
        <div className="p-4 rounded-xl bg-brand-mint/50 border border-brand-mint-border text-xs sm:text-sm text-brand-forest flex items-start space-x-3 mb-6">
          <AlertCircle className="w-5 h-5 text-brand-forest shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Important Notice:</p>
            <p className="text-xs text-brand-dark mt-0.5 leading-relaxed">
              “Your booking request has been received. Our team will contact you to confirm availability and payment.”
              Please note this request is distinct from a confirmed reservation until review is complete.
            </p>
          </div>
        </div>

        {/* Itemized Booking Summary Table */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 space-y-3 text-xs sm:text-sm mb-6">
          <h4 className="font-bold text-brand-dark text-xs uppercase tracking-wider mb-2">
            Session Details
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-brand-muted">Rental Date:</span>
              <p className="font-bold text-brand-dark">{booking.booking_date}</p>
            </div>
            <div>
              <span className="text-brand-muted">Reserved Hours:</span>
              <p className="font-bold text-brand-dark">
                {booking.start_time} – {booking.end_time} ({booking.duration_hours} hrs)
              </p>
            </div>
            <div>
              <span className="text-brand-muted">Intended Production:</span>
              <p className="font-bold text-brand-dark">{booking.intended_use}</p>
            </div>
            <div>
              <span className="text-brand-muted">Kitchen Crew Size:</span>
              <p className="font-bold text-brand-dark">{booking.team_size} Person(s)</p>
            </div>
            <div>
              <span className="text-brand-muted">Contact Email:</span>
              <p className="font-bold text-brand-dark truncate">{booking.email}</p>
            </div>
            <div>
              <span className="text-brand-muted">Contact Phone:</span>
              <p className="font-bold text-brand-dark">{booking.phone}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
            <span className="text-brand-muted">Estimated Rental Amount:</span>
            <span className="font-extrabold text-base text-brand-forest font-mono">
              ${booking.total_price.toFixed(2)} AUD
            </span>
          </div>
        </div>

        {/* What Happens Next Roadmap */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark">
            Next Steps in the Onboarding Process:
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-forest text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </span>
              <p className="text-brand-dark">
                <span className="font-bold">Manager Verification:</span> Our facility team reviews your equipment requests and schedules within 2 to 4 business hours.
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-forest text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </span>
              <p className="text-brand-dark">
                <span className="font-bold">Invoice & Payment Link:</span> You will receive an official Daily Drop invoice and payment instructions (bank transfer or online).
              </p>
            </div>
            <div className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-forest text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </span>
              <p className="text-brand-dark">
                <span className="font-bold">Check-In PIN & Induction:</span> Upon payment, your digital door access PIN and kitchen hygiene orientation guide are issued.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={downloadICS}
            className="flex-1 bg-brand-forest hover:bg-brand-forest-light text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-soft transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Add to Calendar (.ics)</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-white hover:bg-gray-50 text-brand-dark border border-gray-300 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors text-center"
          >
            Done & Return to Homepage
          </button>
        </div>

      </div>
    </div>
  );
};
