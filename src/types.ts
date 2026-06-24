export interface FixedCost {
  id: string;
  name: string;
  value: number;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minPayment: number;
}

export type StrategyType = 'avalanche' | 'snowball' | 'balanced';

export interface AppState {
  hasStarted: boolean;
  currency: string;
  income: number;
  fixedCosts: FixedCost[];
  debts: Debt[];
  acceleratorStrength: number; // 0 to 100 percentage
  strategy: StrategyType;
  savingsAllocation: number; // 0 to 100 percentage (rest goes to debt payoff)
  activeTab: 'base' | 'escaner' | 'valvula' | 'proyeccion';
  isDarkMode: boolean;
}
