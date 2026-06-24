import { useMemo } from 'react';
import { Debt, StrategyType } from '../types';

export interface MonthData {
  month: number;
  year: number;
  statusQuoValue: number; // Net worth = Assets - Debt
  acceleratorValue: number; // Net worth = Assets - Debt
  statusQuoDebt: number;
  acceleratorDebt: number;
  statusQuoAssets: number;
  acceleratorAssets: number;
}

interface UseProjectionProps {
  income: number;
  fixedCosts: { value: number }[];
  debts: Debt[];
  acceleratorStrength: number;
  strategy: StrategyType;
  savingsAllocation: number;
}

export function useProjection({
  income,
  fixedCosts,
  debts,
  acceleratorStrength,
  strategy,
  savingsAllocation,
}: UseProjectionProps) {
  return useMemo(() => {
    const monthsCount = 120; // 10 years
    const data: MonthData[] = [];

    // Calculate fixed costs total
    const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
    const surplus = Math.max(0, income - totalCosts);
    const committedAccelerator = surplus * (acceleratorStrength / 100);

    const savingsPercent = strategy === 'balanced' ? savingsAllocation : 0;
    const debtPercent = 100 - savingsPercent;

    const monthlySavingsBuild = committedAccelerator * (savingsPercent / 100);
    const monthlyExtraDebtPayoff = committedAccelerator * (debtPercent / 100);

    // --- Path A: Status Quo State ---
    let sqDebts = debts.map(d => ({ ...d }));
    let sqAssets = 0;
    let sqTotalInterestPaid = 0;

    // --- Path B: Accelerator State ---
    let acDebts = debts.map(d => ({ ...d }));
    let acAssets = 0;
    let acTotalInterestPaid = 0;

    // We assume investments/savings grow at a modest 4.5% annual rate compounding monthly (0.375% per month)
    const monthlyGrowthRate = 0.045 / 12;

    for (let m = 1; m <= monthsCount; m++) {
      const year = Math.floor((m - 1) / 12) + 1;

      // --- CALCULATE STATUS QUO ---
      let sqMonthlyExtraSurplus = surplus; // Leftover of income after fixed costs
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
          sqMonthlyExtraSurplus -= payment; // This money goes out to min payments
        }
      });

      // 2. Accumulate assets with any remaining surplus
      sqAssets += Math.max(0, sqMonthlyExtraSurplus);
      sqAssets *= (1 + monthlyGrowthRate); // grow assets

      const sqTotalDebtRemaining = sqDebts.reduce((sum, d) => sum + d.balance, 0);
      const sqNetWorth = sqAssets - sqTotalDebtRemaining;

      // --- CALCULATE ACCELERATOR ---
      let acMonthlyExtraSurplus = surplus; 
      let acInterestThisMonth = 0;

      // 1. Add baseline savings build to accelerator assets
      acAssets += monthlySavingsBuild;

      // 2. Pay interest on all debts
      acDebts.forEach(d => {
        if (d.balance > 0) {
          const interest = d.balance * (d.interestRate / 100 / 12);
          acInterestThisMonth += interest;
          acTotalInterestPaid += interest;
          d.balance += interest;
        }
      });

      // 3. Make standard minimum payments first
      acDebts.forEach(d => {
        if (d.balance > 0) {
          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
          acMonthlyExtraSurplus -= payment; // reduction of left over surplus
        }
      });

      // 4. Deploy the EXTRA accelerator payment + rolled over minimums
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
            // Avalanche or Balanced: Highest interest rate first
            activeDebts.sort((a, b) => b.interestRate - a.interestRate);
            prioritizedDebt = activeDebts[0];
          }
        }

        if (prioritizedDebt) {
          // Pay prioritized debt with extra
          const extraPayment = Math.min(prioritizedDebt.balance, extraAvailable);
          prioritizedDebt.balance -= extraPayment;
          acMonthlyExtraSurplus -= extraPayment;
        }
      }

      // 5. Accumulate assets with leftover surplus (or full surplus if debt is 0)
      const acTotalDebtRemaining = acDebts.reduce((sum, d) => sum + d.balance, 0);
      
      // If all debt is paid off, the entire surplus (minus fixed costs) rolls directly into building assets!
      if (acTotalDebtRemaining <= 0) {
        acAssets += Math.max(0, acMonthlyExtraSurplus);
      } else {
        acAssets += Math.max(0, acMonthlyExtraSurplus - monthlyExtraDebtPayoff);
      }
      acAssets *= (1 + monthlyGrowthRate); // grow assets

      const acNetWorth = acAssets - acTotalDebtRemaining;

      data.push({
        month: m,
        year,
        statusQuoValue: sqNetWorth,
        acceleratorValue: acNetWorth,
        statusQuoDebt: sqTotalDebtRemaining,
        acceleratorDebt: acTotalDebtRemaining,
        statusQuoAssets: sqAssets,
        acceleratorAssets: acAssets,
      });
    }

    // Find months to pay off all debt
    let sqDebtFreeMonth = -1;
    let acDebtFreeMonth = -1;

    for (let i = 0; i < data.length; i++) {
      if (sqDebtFreeMonth === -1 && data[i].statusQuoDebt <= 0) {
        sqDebtFreeMonth = i + 1;
      }
      if (acDebtFreeMonth === -1 && data[i].acceleratorDebt <= 0) {
        acDebtFreeMonth = i + 1;
      }
    }

    // Default to end of projection if still in debt
    const sqMonths = sqDebtFreeMonth === -1 ? 120 : sqDebtFreeMonth;
    const acMonths = acDebtFreeMonth === -1 ? 120 : acDebtFreeMonth;

    const monthsSaved = Math.max(0, sqMonths - acMonths);
    const yearsSaved = Number((monthsSaved / 12).toFixed(1));

    const totalInterestSaved = Math.max(0, sqTotalInterestPaid - acTotalInterestPaid);

    // Final Net Worth after 10 years
    const finalSQNetWorth = data[data.length - 1].statusQuoValue;
    const finalACNetWorth = data[data.length - 1].acceleratorValue;
    const extraWealthCreated = Math.max(0, finalACNetWorth - finalSQNetWorth);

    return {
      monthlyData: data,
      sqTotalInterest: sqTotalInterestPaid,
      acTotalInterest: acTotalInterestPaid,
      kpis: {
        yearsSaved,
        totalInterestSaved,
        extraWealthCreated,
        sqDebtFreeMonth,
        acDebtFreeMonth,
      }
    };
  }, [income, fixedCosts, debts, acceleratorStrength, strategy, savingsAllocation]);
}
