import axios from 'axios';
import { Transaction } from '../context/FinanceContext';

// Use localhost for now, same as AuthContext
const API_URL = 'http://localhost:8000/v1';

export const transactionService = {
    getTransactions: async (month: string) => {
        const response = await axios.get(`${API_URL}/transactions`, {
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
        const response = await axios.post(`${API_URL}/transactions`, payload);
        return response.data;
    },

    getFinanceSummary: async (month: string) => {
        const response = await axios.get(`${API_URL}/finance/summary`, {
            params: { month }
        });
        return response.data;
    },

    getSpendingAnalytics: async (month: string) => {
        const response = await axios.get(`${API_URL}/analytics/spending`, {
            params: { month }
        });
        return response.data;
    }
};
