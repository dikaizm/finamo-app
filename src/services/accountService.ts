import { authApi } from './authService';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'checking' | 'savings' | 'investment' | 'credit_card' | 'loan' | 'e_wallet';
  balance: number;
  currency: string;
  is_active: boolean;
  institution?: string;
  created_at: string;
  updated_at: string;
}

export interface TransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
}

export interface InitialBalanceInput {
  account_id: string;
  balance: number;
  description?: string;
}

export interface BalanceInput {
  account_type: string;
  balance: string;
  note?: string;
}

/**
 * Get all user accounts
 */
export async function getAccounts(includeInactive = false): Promise<Account[]> {
  const response = await authApi.get('/accounts', {
    params: { include_inactive: includeInactive },
  });
  return response.data.data?.accounts || [];
}

/**
 * Get single account by ID
 */
export async function getAccountById(accountId: string): Promise<Account> {
  const response = await authApi.get(`/accounts/${accountId}`);
  return response.data.data;
}

/**
 * Create new account
 */
export async function createAccount(data: {
  name: string;
  type: string;
  balance?: number;
  currency?: string;
  institution?: string;
}): Promise<Account> {
  const response = await authApi.post('/accounts', data);
  return response.data.data;
}

/**
 * Update account
 */
export async function updateAccount(
  accountId: string,
  data: {
    name?: string;
    institution?: string;
    is_active?: boolean;
    balance?: number;
  }
): Promise<Account> {
  const response = await authApi.put(`/accounts/${accountId}`, data);
  return response.data.data;
}

/**
 * Delete an account (must have zero balance)
 */
export async function deleteAccount(accountId: string): Promise<void> {
  await authApi.delete(`/accounts/${accountId}`);
}

/**
 * Create transfer between accounts
 */
export async function createTransfer(data: TransferInput): Promise<any> {
  const response = await authApi.post('/accounts/transfer', data);
  return response.data.data;
}

/**
 * Get net worth summary
 */
export async function getNetWorth(): Promise<{
  net_worth: number;
  total_assets: number;
  total_liabilities: number;
  by_type: Record<string, { count: number; balance: number }>;
}> {
  const response = await authApi.get('/accounts/net-worth/current');
  return response.data.data;
}

/**
 * Get accounts summary
 */
export async function getAccountsSummary(): Promise<{
  by_type: Record<string, { count: number; balance: number }>;
  total_balance: number;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  account_count: number;
}> {
  const response = await authApi.get('/accounts/summary');
  return response.data.data;
}

/**
 * Check onboarding status
 */
export async function getOnboardingStatus(): Promise<{
  is_complete: boolean;
  has_accounts: boolean;
  accounts_count: number;
  step: string;
}> {
  const response = await authApi.get('/onboarding/status');
  return response.data.data;
}

/**
 * Initialize default accounts for new user
 */
export async function initializeAccounts(): Promise<any> {
  const response = await authApi.post('/onboarding/initialize');
  return response.data.data;
}

/**
 * Complete onboarding with initial balances
 */
export async function completeOnboarding(initialBalances: InitialBalanceInput[]): Promise<any> {
  const response = await authApi.post('/onboarding/complete', {
    initial_balances: initialBalances,
  });
  return response.data.data;
}

/**
 * Get AI financial insights
 */
export async function getFinancialInsights(): Promise<{
  cash_flow: any;
  net_worth: any;
  recommendations: Array<{
    type: string;
    category: string;
    priority: string;
    title: string;
    message: string;
    action: string;
  }>;
  health_score: {
    score: number;
    rating: string;
    color: string;
    issues_count: number;
    top_issues: string[];
  };
}> {
  const response = await authApi.get('/ai-insights');
  return response.data.data;
}

/**
 * Get just the health score
 */
export async function getHealthScore(): Promise<{
  score: number;
  rating: string;
  color: string;
  issues_count: number;
  top_issues: string[];
}> {
  const response = await authApi.get('/ai-insights/health-score');
  return response.data.data;
}

/**
 * Get AI recommendations
 */
export async function getRecommendations(): Promise<Array<{
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  action: string;
}>> {
  const response = await authApi.get('/ai-insights/recommendations');
  return response.data.data;
}
