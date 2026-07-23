import { Debt, StrategyType } from './types';

/**
 * Currency metadata: symbol shown in the UI for each supported currency code.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  MXN: '$',
  COP: '$',
  ARS: '$',
  CLP: '$',
  PEN: 'S/.',
};

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || '$';
}

/**
 * Currencies that follow the US numeric convention: comma as thousands
 * separator, dot as decimal separator (e.g. 1,234.56).
 * Every other supported currency uses the inverse convention (1.234,56),
 * which is the standard in the Eurozone and across Latin America.
 */
const US_STYLE_CURRENCIES = new Set(['USD']);

export function getCurrencyLocale(code: string): string {
  return US_STYLE_CURRENCIES.has(code) ? 'en-US' : 'es-ES';
}

function getSeparators(code: string): { thousands: string; decimal: string } {
  return getCurrencyLocale(code) === 'en-US'
    ? { thousands: ',', decimal: '.' }
    : { thousands: '.', decimal: ',' };
}

/**
 * Formats a plain number for display (KPIs, chart labels, totals) using the
 * numeric convention that matches the selected currency.
 */
export function formatCurrencyNumber(value: number, code: string, maxDecimals = 0): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  const locale = getCurrencyLocale(code);
  return value.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Formats a number or numeric string as the user types it, using the
 * thousands/decimal separators that match the selected currency.
 * Automatically handles user typing with either separator character.
 */
export function formatNumberInput(val: number | string | undefined, code: string): string {
  if (val === undefined || val === null || val === '') return '';
  const { thousands, decimal } = getSeparators(code);

  if (typeof val === 'number') {
    const hasDecimal = val % 1 !== 0;
    return val.toLocaleString(getCurrencyLocale(code), {
      minimumFractionDigits: 0,
      maximumFractionDigits: hasDecimal ? 2 : 0,
    });
  }

  let cleaned = val;
  const otherChar = decimal === ',' ? '.' : ',';
  const otherCharEscaped = otherChar === '.' ? '\\.' : ',';

  // Replace the "other" separator with the correct decimal char if it's
  // clearly being used as a decimal marker (e.g. typed at the end, or
  // followed by 1-2 digits).
  if (!cleaned.includes(decimal) && (cleaned.endsWith(otherChar) || new RegExp(`${otherCharEscaped}\\d{1,2}$`).test(cleaned))) {
    cleaned = cleaned.split(otherChar).join(decimal);
  }

  // Remove any remaining thousands separators.
  cleaned = cleaned.split(thousands).join('');
  // Mark the decimal separator temporarily so it survives the next strip.
  cleaned = cleaned.split(decimal).join('DECIMAL_POINT');
  cleaned = cleaned.replace(/[^0-9DECIMAL_POINT]/g, '');

  // Keep only the first decimal marker.
  const firstPointIdx = cleaned.indexOf('DECIMAL_POINT');
  if (firstPointIdx !== -1) {
    const before = cleaned.substring(0, firstPointIdx).replace(/DECIMAL_POINT/g, '');
    const after = cleaned.substring(firstPointIdx + 1).replace(/DECIMAL_POINT/g, '');
    cleaned = before + 'DECIMAL_POINT' + after;
  }

  const parts = cleaned.split('DECIMAL_POINT');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;

  if (integerPart) {
    const num = Number(integerPart);
    integerPart = isNaN(num) ? '0' : String(num);
    const digitParts: string[] = [];
    let i = integerPart.length;
    while (i > 0) {
      digitParts.unshift(integerPart.substring(Math.max(0, i - 3), i));
      i -= 3;
    }
    integerPart = digitParts.join(thousands);
  } else {
    integerPart = '0';
  }

  if (decimalPart !== null) {
    return integerPart + decimal + decimalPart.substring(0, 2);
  }

  return integerPart;
}

/**
 * Parses a currency-formatted string back into a raw floating-point number,
 * using the thousands/decimal separators that match the selected currency.
 */
export function parseNumberInput(val: string, code: string): number {
  if (!val) return 0;
  const { thousands, decimal } = getSeparators(code);
  const standardized = val.split(thousands).join('').split(decimal).join('.');
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

interface CSVReportData {
  currency: string;
  income: number;
  totalCosts: number;
  surplus: number;
  debtPct: number;
  savingsPct: number;
  personalPct: number;
  monthlyExtraDebtPayoff: number;
  monthlySavingsBuild: number;
  monthlyPersonalSpend: number;
  strategy: StrategyType;
  kpis: {
    yearsSaved: number;
    totalInterestSaved: number;
    sqDebtFreeMonth: number;
    acDebtFreeMonth: number;
  };
  monthlyData: any[];
  debts: Debt[];
}

/**
 * Generates and triggers the download of the CSV Financial Acceleration Report.
 */
export function downloadCSVReport({
  currency,
  income,
  totalCosts,
  surplus,
  debtPct,
  savingsPct,
  personalPct,
  monthlyExtraDebtPayoff,
  monthlySavingsBuild,
  monthlyPersonalSpend,
  strategy,
  kpis,
  monthlyData,
  debts,
}: CSVReportData) {
  const csvRows: string[] = [];

  // Header & metadata
  csvRows.push('REPORTE PLAN MAESTRO DE ACELERACIÓN FINANCIERA');
  csvRows.push(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`);
  csvRows.push('');

  // Profile summary
  csvRows.push('1. RESUMEN DEL PERFIL FINANCIERO');
  csvRows.push(`Moneda seleccionada;${currency}`);
  csvRows.push(`Ingresos Mensuales;${income.toFixed(2)}`);
  csvRows.push(`Gastos Innegociables Totales (Sin Deudas);${totalCosts.toFixed(2)}`);
  csvRows.push(`Sobrante Mensual Neto (La Base - El Escáner);${surplus.toFixed(2)}`);
  csvRows.push(`Pago Extra de Deudas;${debtPct}% (${monthlyExtraDebtPayoff.toFixed(2)} /mes)`);
  csvRows.push(`Reserva de Ahorros;${savingsPct}% (${monthlySavingsBuild.toFixed(2)} /mes)`);
  csvRows.push(`Gastos Personales;${personalPct}% (${monthlyPersonalSpend.toFixed(2)} /mes)`);
  csvRows.push(`Estrategia de Deuda;${strategy === 'snowball' ? 'Bola de Nieve (Menor Saldo)' : 'Avalancha (Mayor Interés)'}`);
  csvRows.push('');

  // Performance outcomes
  csvRows.push('2. PROYECCIÓN DE LOGROS E IMPACTO');
  csvRows.push(`Años Ahorrados en Deuda;${kpis.yearsSaved === 0 ? 'Sin Deudas' : `${kpis.yearsSaved} Años`}`);
  csvRows.push(`Intereses Totales Evitados;${kpis.totalInterestSaved.toFixed(2)}`);
  const finalMonth = monthlyData[monthlyData.length - 1];
  if (finalMonth) {
    csvRows.push(`Patrimonio Proyectado a 10 años (Status Quo);${finalMonth.statusQuoValue.toFixed(2)}`);
    csvRows.push(`Patrimonio Proyectado a 10 años (Acelerador);${finalMonth.acceleratorValue.toFixed(2)}`);
    csvRows.push(`Diferencia de Riqueza Generada;${(finalMonth.acceleratorValue - finalMonth.statusQuoValue).toFixed(2)}`);
  }
  csvRows.push('');

  // Debts registered
  csvRows.push('3. INVENTARIO DE DEUDAS');
  csvRows.push('ID;Nombre de la Deuda;Saldo Pendiente;Pago Mínimo');
  if (debts.length === 0) {
    csvRows.push('-;Sin deudas registradas;0.00;0.00');
  } else {
    debts.forEach((debt, idx) => {
      csvRows.push(`${idx + 1};${debt.name || `Deuda ${idx + 1}`};${debt.balance.toFixed(2)};${debt.minPayment.toFixed(2)}`);
    });
  }
  csvRows.push('');

  // Month-by-month trajectory
  csvRows.push('4. TRAYECTORIA MENSUAL PROYECTADA (120 MESES)');
  csvRows.push('Mes;Año;Patrimonio Status Quo;Patrimonio Acelerador;Deuda Status Quo;Deuda Acelerador;Activos Status Quo;Activos Acelerador');
  monthlyData.forEach((row) => {
    csvRows.push([
      row.month,
      row.year,
      row.statusQuoValue.toFixed(2),
      row.acceleratorValue.toFixed(2),
      row.statusQuoDebt.toFixed(2),
      row.acceleratorDebt.toFixed(2),
      row.statusQuoAssets.toFixed(2),
      row.acceleratorAssets.toFixed(2)
    ].join(';'));
  });

  const csvContent = csvRows.join('\n');
  // Prepend UTF-8 Byte Order Mark (BOM) so Excel reads international characters perfectly
  const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Reporte_Acelerador_Financiero_${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

