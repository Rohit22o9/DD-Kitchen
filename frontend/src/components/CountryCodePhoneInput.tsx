import React, { useState, useEffect } from 'react';

export interface CountryCodeOption {
  code: string;
  country: string;
  flag: string;
  formatPlaceholder: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+61', country: 'Australia', flag: '🇦🇺', formatPlaceholder: '0412 345 678' },
  { code: '+91', country: 'India', flag: '🇮🇳', formatPlaceholder: '98765 43210' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿', formatPlaceholder: '021 123 4567' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', formatPlaceholder: '7911 123456' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', formatPlaceholder: '(555) 000-0000' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', formatPlaceholder: '8123 4567' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', formatPlaceholder: '12-345 6789' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', formatPlaceholder: '917 123 4567' },
  { code: '+86', country: 'China', flag: '🇨🇳', formatPlaceholder: '138 0000 0000' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', formatPlaceholder: '812-3456-7890' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', formatPlaceholder: '50 123 4567' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦', formatPlaceholder: '82 123 4567' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', formatPlaceholder: '151 23456789' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', formatPlaceholder: '90-1234-5678' }
];

interface CountryCodePhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  id?: string;
  name?: string;
}

export const CountryCodePhoneInput: React.FC<CountryCodePhoneInputProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder,
  id,
  name
}) => {
  // Parse initial country code and local number
  const detectInitial = (raw: string) => {
    if (!raw) return { code: '+61', number: '' };
    const trimmed = raw.trim();
    for (const item of COUNTRY_CODES) {
      if (trimmed.startsWith(item.code)) {
        return {
          code: item.code,
          number: trimmed.substring(item.code.length).trim()
        };
      }
    }
    // Default to +61
    return { code: '+61', number: trimmed };
  };

  const initial = detectInitial(value);
  const [selectedCode, setSelectedCode] = useState<string>(initial.code);
  const [phoneNumber, setPhoneNumber] = useState<string>(initial.number);

  // Sync if value prop changes externally
  useEffect(() => {
    const updated = detectInitial(value);
    setSelectedCode(updated.code);
    setPhoneNumber(updated.number);
  }, [value]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedCode(newCode);
    const full = phoneNumber.trim() ? `${newCode} ${phoneNumber.trim()}` : '';
    onChange(full);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    setPhoneNumber(newNumber);
    const full = newNumber.trim() ? `${selectedCode} ${newNumber.trim()}` : '';
    onChange(full);
  };

  const currentOption = COUNTRY_CODES.find((c) => c.code === selectedCode) || COUNTRY_CODES[0];

  return (
    <div className={`flex rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-brand-forest focus-within:border-brand-forest overflow-hidden transition-all shadow-2xs ${className}`}>
      {/* Country Code Dropdown */}
      <div className="relative border-r border-gray-200 bg-gray-50 flex items-center shrink-0">
        <select
          value={selectedCode}
          onChange={handleCodeChange}
          aria-label="Country Dialing Code"
          className="appearance-none bg-transparent pl-3 pr-7 py-3 text-xs sm:text-sm font-semibold text-brand-dark cursor-pointer focus:outline-none"
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.code} ({item.country})
            </option>
          ))}
        </select>
        {/* Dropdown Chevron */}
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Phone Number Input */}
      <input
        type="tel"
        id={id}
        name={name}
        required={required}
        placeholder={placeholder || currentOption.formatPlaceholder}
        value={phoneNumber}
        onChange={handlePhoneChange}
        className="flex-1 px-3 sm:px-4 py-3 bg-transparent text-xs sm:text-sm text-brand-dark font-medium placeholder-gray-400 focus:outline-none"
      />
    </div>
  );
};

