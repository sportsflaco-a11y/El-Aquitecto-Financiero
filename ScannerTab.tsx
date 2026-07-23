import React, { useState, useEffect } from 'react';
import { formatNumberInput, parseNumberInput } from '../utils';

interface FormattedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (val: number) => void;
  /** Currency code (e.g. 'USD', 'COP') used to pick the right thousands/decimal separators. */
  currencyCode?: string;
}

export default function FormattedInput({ value, onChange, currencyCode = 'USD', ...props }: FormattedInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Keep displayValue in sync with value prop when updated externally
  useEffect(() => {
    const formatted = formatNumberInput(value, currencyCode);
    if (parseNumberInput(displayValue, currencyCode) !== value || (value === 0 && displayValue === '')) {
      setDisplayValue(formatted);
    }
  }, [value, currencyCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const formatted = formatNumberInput(rawInput, currencyCode);
    setDisplayValue(formatted);

    const parsed = parseNumberInput(formatted, currencyCode);
    onChange(parsed);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );
}
