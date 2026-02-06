import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionService } from '../services/transactionService';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'saving';
  category: string;
  amount: number;
  description: string;
  date: Date;
}

export interface FinancialData {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySaving: number;
  transactions: Transaction[];
  spendingByCategory: { [key: string]: number };
  isLoading: boolean;
}

interface FinanceContextType {
  financialData: FinancialData;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateBalance: (amount: number) => void;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlySaving: 0,
    transactions: [],
    spendingByCategory: {},
    isLoading: false,
  });

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('financialData_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Restore Date objects
          parsed.transactions = parsed.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }));
          setFinancialData(prev => ({ ...parsed, isLoading: prev.isLoading }));
        }
      } catch (e) {
        console.log('No cached financial data');
      }
    };
    loadCachedData();
  }, []);

  const fetchFinancialData = useCallback(async () => {
    if (!user) {
      // Reset data on logout
      setFinancialData({
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        monthlySaving: 0,
        transactions: [],
        spendingByCategory: {},
        isLoading: false,
      });
      return;
    }

    setFinancialData(prev => ({ ...prev, isLoading: true }));
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');

      const [summary, spending, transactions] = await Promise.all([
        transactionService.getFinanceSummary(currentMonth),
        transactionService.getSpendingAnalytics(currentMonth),
        transactionService.getTransactions(currentMonth)
      ]);

      const mappedTransactions = transactions.map((t: any) => ({
        id: t.id.toString(),
        type: t.type, // backend types needs to match or be mapped if different
        category: t.category,
        amount: t.amount,
        description: t.name,
        date: new Date(t.date),
      }));

      // Map backend spending analytics to frontend format
      const spendingMap: { [key: string]: number } = {};
      spending.byCategory.forEach((item: any) => {
        spendingMap[item.category] = item.amount;
      });

      const newData = {
        totalBalance: summary.totalBalance,
        monthlyIncome: summary.monthlyIncome,
        monthlyExpense: summary.monthlyExpense,
        monthlySaving: summary.monthlySaving,
        transactions: mappedTransactions,
        spendingByCategory: spendingMap,
        isLoading: false,
      };

      setFinancialData(newData);
      // Cache the new data
      await AsyncStorage.setItem('financialData_cache', JSON.stringify(newData));

    } catch (error) {
      console.error('Failed to fetch financial data', error);
      setFinancialData(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  // Initial fetch when user logs in
  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;

    try {
      // Optimistic update could go here, but for now we wait for server
      await transactionService.createTransaction(transaction);
      await fetchFinancialData(); // Refresh all data to get updated totals
    } catch (error) {
      console.error('Failed to add transaction', error);
      throw error;
    }
  };

  const updateBalance = (amount: number) => {
    // This might be deprecated if everything is calculated from transactions
    setFinancialData((prev) => ({
      ...prev,
      totalBalance: prev.totalBalance + amount,
    }));
  };

  return (
    <FinanceContext.Provider value={{ financialData, addTransaction, updateBalance, refreshData: fetchFinancialData }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
