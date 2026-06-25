import React, { useState, useEffect } from 'react';
import { formatSpanishValue, parseSpanishValue } from '../utils';

interface FormattedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (val: number) => void;
}

export default function FormattedInput({ value, onChange, ...props }: FormattedInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Keep displayValue in sync with value prop when updated externally
  useEffect(() => {
    const formatted = formatSpanishValue(value);
    if (parseSpanishValue(displayValue) !== value || (value === 0 && displayValue === '')) {
      setDisplayValue(formatted);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const formatted = formatSpanishValue(rawInput);
    setDisplayValue(formatted);
    
    const parsed = parseSpanishValue(formatted);
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
