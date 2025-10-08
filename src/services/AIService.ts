import { API_BASE_URL } from '@env';

export interface AICommand {
  type: 'reminder' | 'budget' | 'expense' | 'income' | 'saving' | 'analysis';
  action: string;
  data: any;
}

// Legacy / alternative item shapes normalised internally
export interface TransactionAnalysisItem {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  name?: string;          // new shape field
  description?: string;   // legacy field
  date?: string;
}

// New canonical response: { items: [...] }
export interface TransactionItemsEnvelope { items: TransactionAnalysisItem[]; [k: string]: any }
// Older forms we still gracefully accept
export interface TransactionLegacyEnvelope { transactions?: TransactionAnalysisItem[]; summary?: string; error?: string }
export type TransactionAnalysisResponse = TransactionItemsEnvelope | TransactionLegacyEnvelope | TransactionAnalysisItem[];

class AIService {
  private static instance: AIService;
  private analyzeUrl: string;

  private constructor() {
    const base = (API_BASE_URL || 'http://localhost:8077').replace(/\/$/, '');
    this.analyzeUrl = `${base}/v1/agent/analyze-transactions`;
  }

  static getInstance(): AIService {
    if (!AIService.instance) AIService.instance = new AIService();
    return AIService.instance;
  }

  async parseNaturalLanguage(input: string): Promise<AICommand> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(this.analyzeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, user_id: 1 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        let raw: TransactionAnalysisResponse | undefined;
        try { raw = await res.json(); } catch {}

        let items: TransactionAnalysisItem[] | undefined;
        if (Array.isArray(raw)) {
          items = raw as TransactionAnalysisItem[];
        } else if (raw && 'items' in raw && Array.isArray((raw as TransactionItemsEnvelope).items)) {
          items = (raw as TransactionItemsEnvelope).items;
        } else if (raw && 'transactions' in raw) {
          items = (raw as TransactionLegacyEnvelope).transactions || [];
        }

        if (items && items.length) {
          // Normalize first meaningful transaction
            const tx = items[0];
            const type = tx.type === 'income' ? 'income' : 'expense';
            const description = tx.description || tx.name || input;
            const category = this.capitalizeCategory(tx.category || 'others');
            if (type === 'expense') {
              return {
                type: 'expense',
                action: 'add_expense',
                data: { amount: tx.amount, category, description },
              };
            } else {
              return {
                type: 'income',
                action: 'add_income',
                data: { amount: tx.amount, description },
              };
            }
        }
      } else if (res.status !== 404) {
        // 404 specifically might mean backend not updated yet; suppress noisy logs.
        console.warn('analyze-transactions non-OK', res.status);
      }
    } catch (e: any) {
      console.warn('analyze-transactions error', e?.message || e);
    }
    return this.fallbackParsing(input);
  }

  // ---- Fallback Heuristic Parsing ----
  private fallbackParsing(input: string): AICommand {
    const lower = input.toLowerCase();

    if (lower.includes('remind') || lower.includes('reminder')) {
      return {
        type: 'reminder',
        action: 'create_reminder',
        data: { message: input, time: this.extractDateTime(input) },
      };
    }
    if (lower.includes('budget') || lower.includes('plan')) {
      return {
        type: 'budget',
        action: 'create_budget',
        data: { period: this.extractTimePeriod(input), message: input },
      };
    }
    if (/(spent|expense|paid)/.test(lower)) {
      const amount = this.extractAmount(input);
      const category = this.extractCategory(input);
      return {
        type: 'expense',
        action: 'add_expense',
        data: { amount, category, description: input },
      };
    }
    if (/(income|earned|received)/.test(lower)) {
      const amount = this.extractAmount(input);
      return {
        type: 'income',
        action: 'add_income',
        data: { amount, description: input },
      };
    }
    if (/(save|saving)/.test(lower)) {
      const amount = this.extractAmount(input);
      return {
        type: 'saving',
        action: 'add_saving',
        data: { amount, goal: input },
      };
    }
    const amount = this.extractAmount(input);
    if (amount > 0) {
      return {
        type: 'expense',
        action: 'add_expense',
        data: { amount, category: this.extractCategory(input), description: input },
      };
    }
    return { type: 'analysis', action: 'analyze', data: { query: input } };
  }

  // ---- Helpers ----
  private extractAmount(text: string): number {
    const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractCategory(text: string): string {
    const cats = ['shopping', 'food', 'transport', 'entertainment', 'utilities', 'others'];
    const lower = text.toLowerCase();
    for (const c of cats) if (lower.includes(c)) return this.capitalizeCategory(c);
    return 'Others';
  }

  private capitalizeCategory(cat: string): string {
    return cat ? cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase() : 'Others';
  }

  private extractDateTime(text: string): Date {
    const lower = text.toLowerCase();
    const now = new Date();
    if (lower.includes('tomorrow')) {
      const t = new Date(); t.setDate(t.getDate() + 1); return t;
    }
    if (lower.includes('next week')) {
      const t = new Date(); t.setDate(t.getDate() + 7); return t;
    }
    return now;
  }

  private extractTimePeriod(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('week')) return 'week';
    if (lower.includes('month')) return 'month';
    if (lower.includes('year')) return 'year';
    return 'month';
  }

  async getFinancialAdvice(financialData: any): Promise<string> {
    const { monthlyIncome, monthlyExpense, monthlySaving } = financialData;
    const savingsRate = monthlyIncome ? (monthlySaving / monthlyIncome) * 100 : 0;
    if (savingsRate < 10) return 'Your savings rate is below 10%. Consider cutting discretionary spending.';
    if (savingsRate < 20) return `You are saving about ${savingsRate.toFixed(0)}%. Aim for 20% for stronger resilience.`;
    return `Great! Saving ${savingsRate.toFixed(0)}% — keep it up!`;
  }
}

export default AIService.getInstance();
