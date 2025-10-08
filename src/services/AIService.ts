import axios from 'axios';

// AI Service for processing natural language commands
export interface AICommand {
  type: 'reminder' | 'budget' | 'expense' | 'income' | 'saving' | 'analysis';
  action: string;
  data: any;
}

export class AIService {
  private static instance: AIService;
  private apiKey: string = ''; // Add your OpenAI API key here

  private constructor() {}

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  // Parse natural language input and convert to structured commands
  async parseNaturalLanguage(input: string): Promise<AICommand> {
    try {
      // Simulate AI parsing - in production, integrate with OpenAI or similar
      const lowerInput = input.toLowerCase();

      // Reminder detection
      if (lowerInput.includes('remind') || lowerInput.includes('reminder')) {
        return {
          type: 'reminder',
          action: 'create_reminder',
          data: {
            message: input,
            time: this.extractDateTime(input),
          },
        };
      }

      // Budget planning
      if (lowerInput.includes('budget') || lowerInput.includes('plan')) {
        return {
          type: 'budget',
          action: 'create_budget',
          data: {
            period: this.extractTimePeriod(input),
            message: input,
          },
        };
      }

      // Expense tracking
      if (lowerInput.includes('spent') || lowerInput.includes('expense') || lowerInput.includes('paid')) {
        const amount = this.extractAmount(input);
        const category = this.extractCategory(input);
        
        return {
          type: 'expense',
          action: 'add_expense',
          data: {
            amount,
            category,
            description: input,
          },
        };
      }

      // Income tracking
      if (lowerInput.includes('income') || lowerInput.includes('earned') || lowerInput.includes('received')) {
        const amount = this.extractAmount(input);
        
        return {
          type: 'income',
          action: 'add_income',
          data: {
            amount,
            description: input,
          },
        };
      }

      // Saving goals
      if (lowerInput.includes('save') || lowerInput.includes('saving')) {
        const amount = this.extractAmount(input);
        
        return {
          type: 'saving',
          action: 'add_saving',
          data: {
            amount,
            goal: input,
          },
        };
      }

      // Default to analysis
      return {
        type: 'analysis',
        action: 'analyze',
        data: {
          query: input,
        },
      };
    } catch (error) {
      console.error('Error parsing natural language:', error);
      throw error;
    }
  }

  // Extract amount from text
  private extractAmount(text: string): number {
    const matches = text.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (matches) {
      return parseFloat(matches[1].replace(/,/g, ''));
    }
    return 0;
  }

  // Extract category from text
  private extractCategory(text: string): string {
    const categories = ['shopping', 'food', 'transport', 'entertainment', 'utilities', 'others'];
    const lowerText = text.toLowerCase();
    
    for (const category of categories) {
      if (lowerText.includes(category)) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }
    
    return 'Others';
  }

  // Extract date and time
  private extractDateTime(text: string): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (text.toLowerCase().includes('tomorrow')) {
      return tomorrow;
    }
    
    if (text.toLowerCase().includes('next week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek;
    }
    
    return new Date();
  }

  // Extract time period
  private extractTimePeriod(text: string): string {
    if (text.toLowerCase().includes('week')) {
      return 'week';
    }
    if (text.toLowerCase().includes('month')) {
      return 'month';
    }
    if (text.toLowerCase().includes('year')) {
      return 'year';
    }
    return 'month';
  }

  // Get AI financial advice
  async getFinancialAdvice(financialData: any): Promise<string> {
    // Simulate AI advice generation
    const { monthlyIncome, monthlyExpense, monthlySaving } = financialData;
    const savingsRate = (monthlySaving / monthlyIncome) * 100;
    
    if (savingsRate < 10) {
      return "Your savings rate is below 10%. Consider reducing discretionary spending to improve your financial health.";
    } else if (savingsRate < 20) {
      return "You're saving around " + savingsRate.toFixed(0) + "% of your income. That's good! Try to reach 20% for optimal financial security.";
    } else {
      return "Excellent! You're saving " + savingsRate.toFixed(0) + "% of your income. Keep up the great work!";
    }
  }
}

export default AIService.getInstance();
