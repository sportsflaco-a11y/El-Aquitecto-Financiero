import { useMemo } from 'react';
import { Debt, StrategyType } from '../types';

export interface MonthData {
  month: number;
  year: number;
  statusQuoValue: number; // Net worth = Assets - Debt (Status Quo)
  acceleratorValue: number; // Net worth = Assets - Debt (Plan with CDT)
  statusQuoDebt: number;
  acceleratorDebt: number;
  statusQuoAssets: number;
  acceleratorAssets: number;
  debtStatusQuo: number;
  debtWithPlan: number;
  savingsBasic: number;
  savingsCDT: number;
}

interface UseProjectionProps {
  income: number;
  fixedCosts: { value: number }[];
  debts: Debt[];
  debtPct: number;
  savingsPct: number;
  personalPct: number;
  strategy: StrategyType;
  cdtAnnualRate?: number;
}

export function useProjection({
  income,
  fixedCosts,
  debts,
  debtPct,
  savingsPct,
  personalPct,
  strategy,
  cdtAnnualRate = 0.10,
}: UseProjectionProps) {
  return useMemo(() => {
    const monthsCount = 120; // 10 years
    const data: MonthData[] = [];

    // Calculate fixed costs total
    const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
    
    // Surplus is "La Base" - "El Escáner"
    const surplus = Math.max(0, income - totalCosts - totalMinPayment);

    const monthlySavingsBuild = surplus * (savingsPct / 100);
    const monthlyExtraDebtPayoff = surplus * (debtPct / 100);
    const monthlyPersonalSpend = surplus * (personalPct / 100);

    // --- Path A: Status Quo State ---
    let sqDebts = debts.map(d => ({ ...d }));
    let sqSavings = 0;
    let sqTotalInterestPaid = 0;

    // --- Path B: Accelerator State ---
    let acDebts = debts.map(d => ({ ...d }));
    let acSavingsBasic = 0;
    let acSavingsCDT = 0;
    let acTotalInterestPaid = 0;

    // Interest Rates
    const basicAnnualRate = 0.02; // 2% basic interest rate for standard savings
    const basicMonthlyRate = basicAnnualRate / 12;

    const cdtMonthlyRate = cdtAnnualRate / 12;

    for (let m = 1; m <= monthsCount; m++) {
      const year = Math.floor((m - 1) / 12) + 1;

      // --- CALCULATE STATUS QUO ---
      let sqInterestThisMonth = 0;

      // 1. Pay interest and make minimum payments for Status Quo
      sqDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * (d.interestRate / 100 / 12);
          sqInterestThisMonth += interest;
          sqTotalInterestPaid += interest;
          d.balance += interest;

          // Make min payment
          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
        }
      });

      // 2. Accumulate assets with any standard savings rate
      sqSavings += monthlySavingsBuild;
      sqSavings *= (1 + basicMonthlyRate);

      const sqTotalDebtRemaining = sqDebts.reduce((sum, d) => sum + d.balance, 0);


      // --- CALCULATE ACCELERATOR (PLAN) ---
      let acInterestThisMonth = 0;

      // 1. Pay interest on all debts
      acDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * (d.interestRate / 100 / 12);
          acInterestThisMonth += interest;
          acTotalInterestPaid += interest;
          d.balance += interest;
        }
      });

      // 2. Make standard minimum payments first
      acDebts.forEach(d => {
        if (d.balance > 0) {
          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
        }
      });

      // 3. Deploy the EXTRA accelerator payment + rolled over minimums
      let extraAvailable = monthlyExtraDebtPayoff;

      // Add minimum payments of already-paid-off debts (compounding rollover snowball/avalanche effect!)
      acDebts.forEach(d => {
        if (d.balance <= 0) {
          extraAvailable += d.minPayment;
        }
      });

      // Find the prioritized debt based on strategy
      if (extraAvailable > 0) {
        let prioritizedDebt: typeof acDebts[0] | null = null;
        const activeDebts = acDebts.filter(d => d.balance > 0);

        if (activeDebts.length > 0) {
          if (strategy === 'snowball') {
            // Snowball: Smallest balance first
            activeDebts.sort((a, b) => a.balance - b.balance);
            prioritizedDebt = activeDebts[0];
          } else {
            // Avalanche: Highest interest rate first
            activeDebts.sort((a, b) => b.interestRate - a.interestRate);
            prioritizedDebt = activeDebts[0];
          }
        }

        if (prioritizedDebt) {
          // Pay prioritized debt with extra
          const extraPayment = Math.min(prioritizedDebt.balance, extraAvailable);
          prioritizedDebt.balance -= extraPayment;
        }
      }

      const acTotalDebtRemaining = acDebts.reduce((sum, d) => sum + d.balance, 0);
      
      // Determine deposits to savings
      let depositBasic = monthlySavingsBuild;
      let depositCDT = monthlySavingsBuild;

      // REDIRECTION OF FREED CASH FLOW:
      // If all debts are fully paid off, the entire amount previously committed to debts
      // (all minimum payments + extra debt payoff) gets directed straight to savings!
      if (acTotalDebtRemaining <= 0) {
        const freedDebtFlow = totalMinPayment + monthlyExtraDebtPayoff;
        depositBasic += freedDebtFlow;
        depositCDT += freedDebtFlow;
      }

      // Add monthly deposits
      acSavingsBasic += depositBasic;
      acSavingsCDT += depositCDT;

      // Apply compound interest
      acSavingsBasic *= (1 + basicMonthlyRate);
      acSavingsCDT *= (1 + cdtMonthlyRate);

      data.push({
        month: m,
        year,
        statusQuoValue: sqSavings - sqTotalDebtRemaining,
        acceleratorValue: acSavingsCDT - acTotalDebtRemaining,
        statusQuoDebt: sqTotalDebtRemaining,
        acceleratorDebt: acTotalDebtRemaining,
        statusQuoAssets: sqSavings,
        acceleratorAssets: acSavingsCDT,
        debtStatusQuo: sqTotalDebtRemaining,
        debtWithPlan: acTotalDebtRemaining,
        savingsBasic: acSavingsBasic,
        savingsCDT: acSavingsCDT,
      });
    }

    // Find months to pay off all debt
    let sqDebtFreeMonth = -1;
    let acDebtFreeMonth = -1;

    for (let i = 0; i < data.length; i++) {
      if (sqDebtFreeMonth === -1 && data[i].debtStatusQuo <= 0) {
        sqDebtFreeMonth = i + 1;
      }
      if (acDebtFreeMonth === -1 && data[i].debtWithPlan <= 0) {
        acDebtFreeMonth = i + 1;
      }
    }

    // Default to end of projection if still in debt
    const sqMonths = sqDebtFreeMonth === -1 ? 120 : sqDebtFreeMonth;
    const acMonths = acDebtFreeMonth === -1 ? 120 : acDebtFreeMonth;

    const monthsSaved = Math.max(0, sqMonths - acMonths);
    const yearsSaved = Number((monthsSaved / 12).toFixed(1));

    const totalInterestSaved = Math.max(0, sqTotalInterestPaid - acTotalInterestPaid);

    const finalSQNetWorth = data[data.length - 1].statusQuoValue;
    const finalACNetWorth = data[data.length - 1].acceleratorValue;
    const extraWealthCreated = Math.max(0, finalACNetWorth - finalSQNetWorth);

    return {
      monthlyData: data,
      sqTotalInterest: sqTotalInterestPaid,
      acTotalInterest: acTotalInterestPaid,
      kpis: {
        yearsSaved,
        monthsSaved,
        totalInterestSaved,
        extraWealthCreated,
        sqDebtFreeMonth,
        acDebtFreeMonth,
      }
    };
  }, [income, fixedCosts, debts, debtPct, savingsPct, personalPct, strategy, cdtAnnualRate]);
}
