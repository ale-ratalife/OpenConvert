import React from 'react';

interface FormatDropdownProps {
  value: string;
  onChange: (value: string) => void;
  formats: string[];
  disabled?: boolean;
  className?: string;
}

export const FormatDropdown: React.FC<FormatDropdownProps> = ({
  value,
  onChange,
  formats,
  disabled = false,
  className = ''
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`dropdown ${className}`}
    >
      {formats.map((format) => (
        <option key={format} value={format.toLowerCase()}>
          {format}
        </option>
      ))}
    </select>
  );
};

interface LanguageDropdownProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'fr', name: 'Français' },
  { code: 'ja', name: '日本語' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'th', name: 'ไทย' },
  { code: 'ar', name: 'العربية' },
];

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  value,
  onChange,
  className = ''
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`dropdown ${className}`}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};