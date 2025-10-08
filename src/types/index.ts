export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'saving';
  category: string;
  amount: number;
  description: string;
  date: Date;
  recurring?: boolean;
  tags?: string[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: Date;
  recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  currency: string;
  language: string;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySaving: number;
  netWorth: number;
  savingsRate: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface AIInsight {
  type: 'tip' | 'warning' | 'achievement';
  title: string;
  description: string;
  actionable?: boolean;
  action?: () => void;
}
