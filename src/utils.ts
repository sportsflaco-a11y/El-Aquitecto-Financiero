/**
 * Formats a number or numeric string to Spanish format (dots for thousands, comma for decimals).
 * It automatically handles user typing, converting decimal dots to commas and grouping thousands.
 */
export function formatSpanishValue(val: number | string | undefined): string {
  if (val === undefined || val === null || val === '') return '';

  if (typeof val === 'number') {
    // Determine if it has decimal places
    const hasDecimal = val % 1 !== 0;
    return val.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: hasDecimal ? 2 : 0,
    });
  }

  // Handle typed string value
  let cleaned = val;

  // Replace dot with comma if it's acting as a decimal separator (at the end or with 1-2 digits)
  if (!cleaned.includes(',') && (cleaned.endsWith('.') || /\.\d{1,2}$/.test(cleaned))) {
    cleaned = cleaned.replace(/\./g, ',');
  }

  // Remove any remaining dots (as they are thousands separators)
  cleaned = cleaned.replace(/\./g, '');
  // Mark decimals temporarily
  cleaned = cleaned.replace(/,/g, 'DECIMAL_POINT');
  // Remove any non-numeric/non-decimal characters
  cleaned = cleaned.replace(/[^0-9DECIMAL_POINT]/g, '');

  // Keep only the first decimal marker
  const firstPointIdx = cleaned.indexOf('DECIMAL_POINT');
  if (firstPointIdx !== -1) {
    const before = cleaned.substring(0, firstPointIdx).replace(/DECIMAL_POINT/g, '');
    const after = cleaned.substring(firstPointIdx + 1).replace(/DECIMAL_POINT/g, '');
    cleaned = before + ',' + after;
  }

  const parts = cleaned.split(',');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;

  if (integerPart) {
    // Remove leading zeros
    const num = Number(integerPart);
    integerPart = isNaN(num) ? '0' : String(num);
    const digitParts = [];
    let i = integerPart.length;
    while (i > 0) {
      digitParts.unshift(integerPart.substring(Math.max(0, i - 3), i));
      i -= 3;
    }
    integerPart = digitParts.join('.');
  } else {
    integerPart = '0';
  }

  if (decimalPart !== null) {
    return integerPart + ',' + decimalPart.substring(0, 2);
  }

  return integerPart;
}

/**
 * Parses a Spanish formatted string back to a raw floating-point number.
 */
export function parseSpanishValue(val: string): number {
  if (!val) return 0;
  const standardized = val.replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(standardized);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a duration in months into a human-readable Spanish string with years and months.
 */
export function formatMonths(mCount: number): string {
  if (mCount === -1 || mCount > 120) return 'Más de 10 años';
  const yrs = Math.floor(mCount / 12);
  const remainingMonths = mCount % 12;
  if (yrs === 0) return `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
  if (remainingMonths === 0) return `${yrs} ${yrs === 1 ? 'año' : 'años'}`;
  return `${yrs} ${yrs === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
}

