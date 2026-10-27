import React from 'react';
import { X, ShieldCheck, FileText, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  onAccept
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-brand-mint-border relative max-h-[88vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-forest/10 text-brand-forest flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-forest" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-brand-dark">
                Daily Drop Ventures' Terms & Conditions
              </h3>
              <p className="text-xs text-brand-muted">
                Commercial Kitchen & Storage Licensing Agreement (Perth, WA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="overflow-y-auto py-5 pr-2 space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-brand-mint/40 border border-brand-forest/20 text-brand-forest text-xs font-medium">
            <strong>Premises:</strong> Daily Drop Commercial Kitchen Hub 1, Unit 1, 1 Lichfield Street, Victoria Park, Western Australia 6101.
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-1">1. Regulatory Compliance & Food Safety (WA Food Act 2008)</h4>
            <p>
              The Hirer acknowledges and agrees that all food preparation within the kitchen premises must strictly comply with the Western Australia Food Act 2008, the Food Safety Standards (Australia New Zealand Food Standards Code 3.2.2 & 3.2.2A), and Town of Victoria Park Environmental Health guidelines. The Hirer must possess an active Food Safety Supervisor (FSS) certificate and provide it upon registration.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-1">2. Public Liability Insurance</h4>
            <p>
              The Hirer must maintain an active Public and Products Liability Insurance policy with a minimum indemnity of $10,000,000 (AUD) per occurrence. A valid Certificate of Currency (COC) must be lodged prior to commencement of kitchen operations or storage occupancy.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-1">3. Facility Care, Hygiene & Cleaning Protocol</h4>
            <p>
              All commercial equipment—including 6-burner gas ranges, Moffat convection ovens, floor fryers, planetary mixer, prep benches, cool room, and freezer storage—must be thoroughly sanitized and returned to immaculate commercial standard before the scheduled departure time. All bins must be lined and disposed into external commercial waste bins. Failure to clean will incur a $150 minimum commercial cleaning deduction.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-1">4. Storage Space Terms & Restrictions (Max 2 Bay Limit)</h4>
            <p>
              Dry storage, cool room, and freezer bays are restricted to licensed tenants with a strict maximum facility capacity of two (2) tenants at any time. All stored items, crates, and containers must be clearly labeled with the Hirer's business name, date of entry, and expiry date. Raw and cooked foods must be stored in compliant separation. Daily Drop reserves the right to dispose of unlabeled or out-of-date items.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-1">5. Electronic Door Access & Security</h4>
            <p>
              Unique electronic keyless PIN access is issued solely to authorized registered personnel. Codes must never be shared with unauthorized third parties. 24/7 CCTV surveillance operates in common kitchen and storage zones for safety, security, and insurance integrity.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-brand-dark mb-1">6. Payment Terms & Security Bond</h4>
            <p>
              Slots are tentatively reserved upon application and officially confirmed only upon receipt of payment via bank transfer / PayID. A standard refundable security bond ($750 for kitchen rental / $200 for storage) is held and returned promptly post-shift inspection.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1.5 text-xs text-brand-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Daily Drop Ventures Pty Ltd • ABN 54 123 456 789</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-semibold text-brand-dark hover:bg-gray-50 cursor-pointer"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-brand-forest hover:bg-brand-forest-light text-white text-xs sm:text-sm font-bold shadow-soft flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>I Accept These Terms</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
