import { authApi } from './authService';
import { Transaction } from '../context/FinanceContext';

/**
 * Unwrap API response and extract data
 */
function unwrapResponse<T>(response: any, endpoint: string): T {
    if (response.status === 'error' || !response.data) {
        const errorMessage = response.errors?.[0]?.message || response.message || 'Unknown error';
        console.error(`[TransactionService] Error from ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
    }
    return response.data;
}

export const transactionService = {
    getTransactions: async (month: string) => {
        const response = await authApi.get('/transactions', {
            params: { month },
        });
        const data = unwrapResponse<any>(response, '/transactions');
        return data?.items || [];
    },

    createTransaction: async (data: Omit<Transaction, 'id'>) => {
        // Backend expects { name, amount, category, type, date, user_id (optional, overridden by auth) }
        // Frontend Transaction has { type, category, amount, description, date }
        // Mapping: description -> name
        const payload = {
            name: data.description,
            amount: data.amount,
            category: data.category,
            type: data.type,
            date: data.date.toISOString(),
        };
        const response = await authApi.post('/transactions', payload);
        return unwrapResponse(response, '/transactions');
    },

    getFinanceSummary: async (month: string) => {
        const response = await authApi.get('/finance/summary', {
            params: { month }
        });
        return unwrapResponse(response, '/finance/summary');
    },

    getSpendingAnalytics: async (month: string) => {
        const response = await authApi.get('/analytics/spending', {
            params: { month }
        });
        return unwrapResponse(response, '/analytics/spending');
    }
};
