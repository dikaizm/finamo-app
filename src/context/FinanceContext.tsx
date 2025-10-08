import React, { createContext, useState, useContext, ReactNode } from 'react';

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
}

interface FinanceContextType {
  financialData: FinancialData;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateBalance: (amount: number) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalBalance: 12500.80,
    monthlyIncome: 5800,
    monthlyExpense: 3250,
    monthlySaving: 2550,
    transactions: [
      {
        id: '1',
        type: 'expense',
        category: 'Shopping',
        amount: 1200,
        description: 'Monthly shopping',
        date: new Date(),
      },
      {
        id: '2',
        type: 'expense',
        category: 'Food',
        amount: 800,
        description: 'Groceries and dining',
        date: new Date(),
      },
      {
        id: '3',
        type: 'expense',
        category: 'Transport',
        amount: 450,
        description: 'Gas and transport',
        date: new Date(),
      },
      {
        id: '4',
        type: 'expense',
        category: 'Others',
        amount: 800,
        description: 'Miscellaneous',
        date: new Date(),
      },
    ],
    spendingByCategory: {
      Shopping: 1200,
      Food: 800,
      Transport: 450,
      Others: 800,
    },
  });

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };

    setFinancialData((prev) => {
      const updatedTransactions = [...prev.transactions, newTransaction];
      const updatedSpending = { ...prev.spendingByCategory };

      if (transaction.type === 'expense') {
        updatedSpending[transaction.category] = 
          (updatedSpending[transaction.category] || 0) + transaction.amount;
      }

      return {
        ...prev,
        transactions: updatedTransactions,
        monthlyExpense: transaction.type === 'expense' 
          ? prev.monthlyExpense + transaction.amount 
          : prev.monthlyExpense,
        monthlyIncome: transaction.type === 'income' 
          ? prev.monthlyIncome + transaction.amount 
          : prev.monthlyIncome,
        monthlySaving: transaction.type === 'saving' 
          ? prev.monthlySaving + transaction.amount 
          : prev.monthlySaving,
        spendingByCategory: updatedSpending,
      };
    });
  };

  const updateBalance = (amount: number) => {
    setFinancialData((prev) => ({
      ...prev,
      totalBalance: prev.totalBalance + amount,
    }));
  };

  return (
    <FinanceContext.Provider value={{ financialData, addTransaction, updateBalance }}>
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
