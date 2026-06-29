import { Debt, StrategyType } from './types';

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
  csvRows.push(`Gastos Innegociables Totales;${totalCosts.toFixed(2)}`);
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

