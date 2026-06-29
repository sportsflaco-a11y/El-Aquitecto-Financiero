import { useMemo } from 'react';
import { Debt } from '../types';

export interface ScannerMetrics {
  totalDebt: number;
  avgInterestRate: number;
  totalMinPayment: number;
  monthlyInterestLeak: number;
  highInterestDebtsCount: number;
  lossOfAvailability: number;
}

export function useScannerMetrics(debts: Debt[], income: number): ScannerMetrics {
  return useMemo(() => {
    const totalDebt = debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
    
    // Weighted average interest rate
    const totalDebtForAvg = debts.reduce((sum, d) => sum + (d.balance > 0 ? Number(d.balance) : 0), 0);
    const weightedInterestSum = debts.reduce((sum, d) => sum + (Number(d.balance) * Number(d.interestRate) || 0), 0);
    const avgInterestRate = totalDebtForAvg > 0 ? (weightedInterestSum / totalDebtForAvg) : 0;

    // Monthly Interest Leak (Balance * Rate / 100 / 12)
    const monthlyInterestLeak = debts.reduce((sum, d) => sum + ((Number(d.balance) * (Number(d.interestRate) / 100)) / 12 || 0), 0);

    // High Interest Threshold is 10%
    const isHighInterest = (rate: number) => rate >= 10;
    const highInterestDebtsCount = debts.filter(d => isHighInterest(d.interestRate) && d.balance > 0).length;

    // Loss of availability (percentage of income spent on debt payments)
    const lossOfAvailability = income > 0 ? (totalMinPayment / income) * 100 : 0;

    return {
      totalDebt,
      avgInterestRate,
      totalMinPayment,
      monthlyInterestLeak,
      highInterestDebtsCount,
      lossOfAvailability,
    };
  }, [debts, income]);
}
