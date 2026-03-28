import { authApi } from './authService';

/**
 * Budget Service
 * 
 * Handles all budget-related API calls.
 * Backend: FastAPI endpoints at /v1/budgets
 */

export interface BudgetCategory {
  id?: string;
  name: string;
  planned_amount: number;
  notes?: string;
  sort_order?: number;
}

export interface BudgetNote {
  id?: string;
  note_type: 'general' | 'recommendation' | 'warning' | 'insight';
  content: string;
  category_id?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // YYYY-MM format
  status: 'draft' | 'active' | 'archived' | 'completed';
  title: string;
  description?: string;
  total_income_target: number;
  total_expense_target: number;
  savings_target?: number;
  savings_rate_target?: number;
  created_by: 'user' | 'ai_agent';
  ai_model?: string;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  archived_at?: string;
  categories?: BudgetCategory[];
  notes?: BudgetNote[];
}

export interface BudgetWithActuals extends Budget {
  actuals: {
    total_income_actual: number;
    total_expense_actual: number;
    total_saving_actual: number;
    overall_variance: number;
    budget_health: 'good' | 'warning' | 'critical';
    category_breakdown: Array<{
      category: string;
      planned: number;
      actual: number;
      variance: number;
      percentage_used: number;
    }>;
  };
}

export interface CreateBudgetInput {
  month: string;
  title?: string;
  description?: string;
  total_income_target: number;
  total_expense_target: number;
  savings_target?: number;
  created_by?: 'user' | 'ai_agent';
  ai_model?: string;
  categories?: BudgetCategory[];
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get active budget with actual spending comparison
 */
export async function getActiveBudget(): Promise<BudgetWithActuals | null> {
  try {
    const response = await authApi.get<any>(`/budgets/active`);
    const data = response.data;
    return data?.data || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // No active budget found
    }
    throw error;
  }
}

/**
 * Get budget by ID
 */
export async function getBudgetById(budgetId: string): Promise<BudgetWithActuals> {
  const response = await authApi.get<any>(`/budgets/${budgetId}`);
  return response.data.data;
}

/**
 * List all user budgets
 */
export async function listBudgets(month?: string): Promise<Budget[]> {
  const params = month ? { month } : {};
  const response = await authApi.get<any>('/budgets', { params });
  return response.data.data;
}

/**
 * Create a new budget
 */
export async function createBudget(data: CreateBudgetInput): Promise<Budget> {
  const response = await authApi.post<any>('/budgets', data);
  return response.data.data;
}

/**
 * Create budget from AI plan (auto-generates categories based on spending analysis)
 */
export async function createBudgetFromAIPlan(month?: string): Promise<Budget> {
  const body = month ? { month } : {};
  const response = await authApi.post<any>('/budgets/from-ai-plan', body);
  return response.data.data;
}

/**
 * Activate a draft budget
 */
export async function activateBudget(budgetId: string): Promise<Budget> {
  const response = await authApi.post<any>(`/budgets/${budgetId}/activate`);
  return response.data.data;
}

/**
 * Archive a budget
 */
export async function archiveBudget(budgetId: string): Promise<Budget> {
  const response = await authApi.post<any>(`/budgets/${budgetId}/archive`);
  return response.data.data;
}

/**
 * Delete a budget (draft only)
 */
export async function deleteBudget(budgetId: string): Promise<void> {
  await authApi.delete(`/budgets/${budgetId}`);
}

/**
 * Update existing budget
 */
export async function updateBudget(
  budgetId: string, 
  data: Partial<CreateBudgetInput>
): Promise<Budget> {
  const response = await authApi.put<any>(`/budgets/${budgetId}`, data);
  return response.data.data;
}

/**
 * Track spending against budget (manual adjustment)
 */
export async function trackBudgetSpend(
  budgetId: string,
  categoryId: string,
  amount: number
): Promise<any> {
  const response = await authApi.post(`/budgets/${budgetId}/spend`, {
    category_id: categoryId,
    amount,
  });
  return response.data;
}
