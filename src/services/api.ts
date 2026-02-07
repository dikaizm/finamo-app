/**
 * Unified API Service
 * 
 * All API requests go through the authenticated axios instance from authService,
 * which handles automatic token refresh on 401 errors.
 */
import authApi from './authService';

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

export interface SpendingCategoryBreakdown {
  category: string;
  amount: number;
}

export interface SpendingAnalytics {
  month: string;
  expensePctOfIncome: number;
  byCategory: SpendingCategoryBreakdown[];
  incomeTotal: number;
  expenseTotal: number;
  currency: string;
}

export interface SavingsGoalProgress {
  goalId: string;
  name: string;
  target: number;
  saved: number;
}

export interface SavingsSummary {
  month: string;
  totalSaved: number;
  activeGoals?: number;
  goalsProgress?: SavingsGoalProgress[];
}

export interface AdviceResponse {
  month: string;
  tips: string[];
}

export type AgentAnalyzeResponse = {
  answer?: string;
};

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

export interface TransactionUpdate {
  name?: string;
  amount?: number;
  category?: string;
  date?: string;
  notes?: string | null;
}

export interface TransactionsList {
  items: TransactionOut[];
  month: string;
  total: number;
}

// API Response wrapper interface (matches backend)
interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
  errors: Array<{
    code: string;
    message: string;
    details?: unknown;
  }> | null;
}

/**
 * Unwrap API response and extract data, throwing on error
 */
function unwrapResponse<T>(response: ApiResponse<T>, endpoint: string): T {
  if (response.status === 'error' || !response.data) {
    const errorMessage = response.errors?.[0]?.message || response.message || 'Unknown error';
    console.error(`[API] Error from ${endpoint}:`, errorMessage);
    throw new Error(errorMessage);
  }
  return response.data;
}

/**
 * Generic GET request helper using authenticated axios client
 */
async function get<T>(path: string): Promise<T> {
  console.log(`[API] GET ${path}`);

  try {
    const response = await authApi.get<ApiResponse<T>>(path);
    return unwrapResponse(response.data, path);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error(`[API] GET ${path} failed:`, err.response?.status, err.message);
    throw error;
  }
}

/**
 * Generic POST request helper using authenticated axios client
 */
async function post<T>(path: string, body?: unknown): Promise<T> {
  console.log(`[API] POST ${path}`);

  try {
    const response = await authApi.post<ApiResponse<T>>(path, body);
    return unwrapResponse(response.data, path);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error(`[API] POST ${path} failed:`, err.response?.status, err.message);
    throw error;
  }
}

/**
 * Generic PATCH request helper using authenticated axios client
 */
async function patch<T>(path: string, body?: unknown): Promise<T> {
  console.log(`[API] PATCH ${path}`);

  try {
    const response = await authApi.patch<ApiResponse<T>>(path, body);
    return unwrapResponse(response.data, path);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error(`[API] PATCH ${path} failed:`, err.response?.status, err.message);
    throw error;
  }
}

/**
 * Generic DELETE request helper using authenticated axios client
 */
async function del<T = void>(path: string): Promise<T> {
  console.log(`[API] DELETE ${path}`);

  try {
    const response = await authApi.delete<ApiResponse<T>>(path);
    // DELETE might return 204 with no body
    if (!response.data) {
      return undefined as unknown as T;
    }
    return unwrapResponse(response.data, path);
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error(`[API] DELETE ${path} failed:`, err.response?.status, err.message);
    throw error;
  }
}

// ---- Public API object ----

export const API = {
  // Finance endpoints
  getFinanceSummary: (month: string) =>
    get<FinanceSummary>(`/finance/summary?month=${month}`),

  // Analytics endpoints
  getSpendingAnalytics: (month: string) =>
    get<SpendingAnalytics>(`/analytics/spending?month=${month}`),

  // Savings endpoints
  getSavingsSummary: (month: string) =>
    get<SavingsSummary>(`/savings/summary?month=${month}`),

  // Advice endpoints
  getAdvice: (month: string) =>
    get<AdviceResponse>(`/advice/finance?month=${month}`),

  // Agent/AI endpoints
  analyzeAgent: (prompt: string, userId: number): Promise<AgentAnalyzeResponse> =>
    post<AgentAnalyzeResponse>('/agent/analyze', { prompt, user_id: userId }),

  // Transaction endpoints
  listTransactions: (month: string, category?: string) =>
    get<TransactionsList>(
      `/transactions?month=${month}${category ? `&category=${encodeURIComponent(category)}` : ''}`
    ),

  createTransaction: (payload: TransactionCreate) =>
    post<TransactionOut>('/transactions', payload),

  updateTransaction: (id: number, payload: TransactionUpdate) =>
    patch<TransactionOut>(`/transactions/${id}`, payload),

  deleteTransaction: (id: number) =>
    del<void>(`/transactions/${id}`),
};

// Export helpers for services that need raw API access
export { get as apiGet, post as apiPost, patch as apiPatch, del as apiDelete };
export default API;
