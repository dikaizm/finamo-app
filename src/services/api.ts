import { API_BASE_URL } from '@env';

// Base URL always includes /v1 suffix (trim any trailing slash first)
const BASE = (API_BASE_URL || 'http://localhost:8077').replace(/\/$/, '') + '/v1';

// Generic JSON request helper with timeout + basic error surfacing
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: controller.signal,
      ...init,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${path}: ${text}`);
    }
    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Types (subset derived from OpenAPI spec) ----
export interface FinanceSummary {
  month: string;
  currency: string;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySaving: number;
  lastMonthGrowthPct: number;
}

export interface SpendingCategoryBreakdown { category: string; amount: number }
export interface SpendingAnalytics {
  month: string;
  expensePctOfIncome: number;
  byCategory: SpendingCategoryBreakdown[];
  incomeTotal: number;
  expenseTotal: number;
  currency: string;
}

export interface SavingsGoalProgress { goalId: string; name: string; target: number; saved: number }
export interface SavingsSummary {
  month: string;
  totalSaved: number;
  activeGoals?: number;
  goalsProgress?: SavingsGoalProgress[];
}

export interface AdviceResponse { month: string; tips: string[] }

export interface TransactionOut {
  id: number;
  name: string;
  amount: number;
  category: string;
  type: string; // income | expense | saving
  date: string; // ISO
  user_id?: number | null;
}
export interface TransactionCreate {
  name: string;
  amount: number;
  category: string;
  type: string; // income | expense | saving
  date: string;
  notes?: string | null;
  user_id?: number | null;
}
export interface TransactionsList { items: TransactionOut[]; month: string; total: number }

export const API = {
  getFinanceSummary: (month: string) => request<FinanceSummary>(`/finance/summary?month=${month}`),
  getSpendingAnalytics: (month: string) => request<SpendingAnalytics>(`/analytics/spending?month=${month}`),
  getSavingsSummary: (month: string) => request<SavingsSummary>(`/savings/summary?month=${month}`),
  getAdvice: (month: string) => request<AdviceResponse>(`/advice/finance?month=${month}`),
  listTransactions: (month: string, category?: string) =>
    request<TransactionsList>(`/transactions?month=${month}${category ? `&category=${encodeURIComponent(category)}` : ''}`),
  createTransaction: (payload: TransactionCreate) =>
    request<TransactionOut>(`/transactions`, { method: 'POST', body: JSON.stringify(payload) }),
};

export { request as rawRequest };
export default API;