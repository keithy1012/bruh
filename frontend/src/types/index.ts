// User and Profile Types
export interface Debt {
  type: string;
  amount: number;
}

export interface UserProfile {
  user_id: string;
  age: number;
  annual_income: number;
  debts: Debt[];
  created_at?: string;
}

// Financial Goal Types
export interface FinancialGoal {
  goal_id: string;
  user_id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  priority: "high" | "medium" | "low";
  category: string;
  on_roadmap: boolean;
}

// Transaction Types
export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  merchant?: string;
}

// Spending Types
export interface SpendingInsight {
  category: string;
  insight_type: string;
  title: string;
  description: string;
  potential_savings?: number;
  action_items: string[];
}

export interface SpendingReport {
  user_id: string;
  report_id: string;
  period: string;
  total_spending: number;
  category_breakdown: Record<string, number>;
  subscriptions: Array<{ name: string; amount: number; frequency: string }>;
  repeat_purchases: Array<Record<string, unknown>>;
  insights: SpendingInsight[];
  optimization_score: number;
}

// Credit Card Types
export interface CreditCardRecommendation {
  name: string;
  issuer: string;
  imageUrl?: string;
  annualFee: number;
  benefits: string[];
  personalizedReason: string;
  recommendedUse: string;
}

export interface CreditCardStackCard {
  name: string;
  reason: string;
  issuer?: string;
  annual_fee?: number;
  best_categories?: string[];
  url?: string;
}

export interface CreditCardStack {
  cards: CreditCardStackCard[];
  total_estimated_annual_value?: number;
  summary?: string;
  strategy?: string;
}

// Chat Types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  conversation_history: ChatMessage[];
}

// Mission Types
export interface Mission {
  mission_id: string;
  user_id: string;
  title: string;
  description: string;
  mission_type: "SAVINGS" | "SPENDING_REDUCTION" | "LEARNING" | "CHALLENGE" | "INVESTMENT";
  target_value?: number;
  deadline: string;
  points: number;
  status: "active" | "completed" | "failed";
  created_at?: string;
  goal_id?: string;
  milestone_percent?: number | null;
}

// User Streak Types
export interface UserStreak {
  user_id: string;
  username: string;
  current_streak: number;
  longest_streak: number;
  total_missions_completed: number;
  shark_level: number;
}
