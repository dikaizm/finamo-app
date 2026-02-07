import { apiClientV1 } from '../config/api';
import { Transaction } from '../context/FinanceContext';

export const transactionService = {
    getTransactions: async (month: string) => {
        const response = await apiClientV1.get('/transactions', {
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
        const response = await apiClientV1.post('/transactions', payload);
        return response.data;
    },

    getFinanceSummary: async (month: string) => {
        const response = await apiClientV1.get('/finance/summary', {
            params: { month }
        });
        return response.data;
    },

    getSpendingAnalytics: async (month: string) => {
        const response = await apiClientV1.get('/analytics/spending', {
            params: { month }
        });
        return response.data;
    }
};
