const rawEnv = process.env['EXPO_PUBLIC_API_BASE_URL'] || undefined;
if (!rawEnv) {
  // eslint-disable-next-line no-console
  console.warn('[api] EXPO_PUBLIC_API_BASE_URL not defined. Falling back to http://localhost:8077');
}
const BASE_ROOT = (rawEnv || 'http://localhost:8077').replace(/\/$/, '');
// Prevent double /v1 if user put it in the env accidentally
const BASE = BASE_ROOT.endsWith('/v1') ? BASE_ROOT : BASE_ROOT + '/v1';

import { getAccessToken } from './authService';

// Generic JSON request helper with timeout + basic error surfacing + auth header
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    // Get auth token from memory
    const token = getAccessToken();
    
    let res: Response;
    try {
      res = await fetch(`${BASE}${path}`, {
        headers: { 
          'Content-Type': 'application/json', 
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(init?.headers || {}) 
        },
        signal: controller.signal,
        ...init,
      });
    } catch (networkErr: any) {
      // Provide actionable hints for production build where localhost / cleartext issues are common
      const hintParts: string[] = [];
      if (/^http:\/\/localhost/.test(BASE)) {
        hintParts.push('Device cannot reach localhost. Use your machine IP (e.g. http://192.168.x.x:8077) in API_BASE_URL for a physical device or emulator.');
      }
      if (BASE.startsWith('http://') && !BASE.includes('192.168') && !BASE.includes('10.') && !BASE.includes('172.')) {
        hintParts.push('If using HTTP (not HTTPS) ensure android:usesCleartextTraffic="true" (added) and server reachable on network.');
      }
      hintParts.push('Original error: ' + (networkErr?.message || networkErr));
      throw new Error('Network request failed for ' + path + '. ' + hintParts.join(' '));
    }
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
export interface TransactionsList { items: TransactionOut[]; month: string; total: number }

export const API = {
  getFinanceSummary: (month: string) => request<FinanceSummary>(`/finance/summary?month=${month}`),
  getSpendingAnalytics: (month: string) => request<SpendingAnalytics>(`/analytics/spending?month=${month}`),
  getSavingsSummary: (month: string) => request<SavingsSummary>(`/savings/summary?month=${month}`),
  getAdvice: (month: string) => request<AdviceResponse>(`/advice/finance?month=${month}`),
  analyzeAgent: (prompt: string, userId: number, timeoutMs = 30000): Promise<AgentAnalyzeResponse> => {
    const ENV_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8077').replace(/\/$/, '');
    // Ensure single /v1 and no double slashes
    const base = ENV_BASE.endsWith('/v1') ? ENV_BASE : `${ENV_BASE}/v1`;
    const url = `${base}/agent/analyze`;

    const token = getAccessToken();

    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);

    return fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
        // Work around mobile fetch stalls on some servers
        'Accept-Encoding': 'identity', // disable gzip
        'Connection': 'close',         // avoid long-lived keep-alive
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt, user_id: userId }),
    })
      .then(async (res) => {
        const raw = await res.text(); // read as text to avoid JSON stream edge cases

        if (!res.ok) {
          // Surface server error body if any
          throw new Error(`Analyze failed ${res.status}: ${raw?.slice(0, 300) || 'no body'}`);
        }

        // Try JSON parse first
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          // Return only the answer as you requested
          return {
            answer: (parsed?.answer ?? '').toString(),
          };
        } catch {
          // If server sent plain text, still return it as the answer
          return { answer: raw?.trim() || '' };
        }
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw err;
      });
  },
  listTransactions: (month: string, category?: string) =>
    request<TransactionsList>(`/transactions?month=${month}${category ? `&category=${encodeURIComponent(category)}` : ''}`),
  createTransaction: (payload: TransactionCreate) =>
    request<TransactionOut>(`/transactions`, { method: 'POST', body: JSON.stringify(payload) }),
  updateTransaction: (id: number, payload: TransactionUpdate) =>
    request<TransactionOut>(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTransaction: (id: number) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};

export { request as rawRequest };
export default API;
