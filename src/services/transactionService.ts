import { authApi } from './authService';
import { Transaction } from '../context/FinanceContext';

export const transactionService = {
    getTransactions: async (month: string) => {
        const response = await authApi.get('/transactions', {
            params: { month },
        });
        return response.data.items;
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
        return response.data;
    },

    getFinanceSummary: async (month: string) => {
        const response = await authApi.get('/finance/summary', {
            params: { month }
        });
        return response.data;
    },

    getSpendingAnalytics: async (month: string) => {
        const response = await authApi.get('/analytics/spending', {
            params: { month }
        });
        return response.data;
    }
};
