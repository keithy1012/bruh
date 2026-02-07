import type {
  ChatResponse,
  FinancialGoal,
  SpendingReport,
  CreditCardStack,
  Mission,
  UserStreak,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `API Error: ${response.status}`);
    }

    return response.json();
  }

  // User Onboarding
  async onboardUser(data: {
    age: number;
    annual_income: number;
    debts: Array<{ type: string; amount: number }>;
  }): Promise<{ user_id: string; message: string; next_step: string }> {
    return this.request("/api/users/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Goal Planning Chat
  async goalPlanningChat(
    message?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ChatResponse> {
    return this.request("/api/goals/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_history: conversationHistory || [],
      }),
    });
  }

  // Finalize Goals
  async finalizeGoals(
    userId: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{ goals: FinancialGoal[]; message: string }> {
    return this.request("/api/goals/finalize", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        conversation_history: conversationHistory,
      }),
    });
  }

  // Credit Optimization Chat
  async creditOptimizationChat(
    userId: string,
    message?: string
  ): Promise<ChatResponse> {
    return this.request(`/api/credit/chat/${userId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Finalize Credit Card Stack
  async finalizeCreditStack(userId: string): Promise<CreditCardStack> {
    return this.request(`/api/credit/finalize/${userId}`, {
      method: "POST",
    });
  }

  // Get Spending Report
  async getSpendingReport(userId: string): Promise<SpendingReport> {
    return this.request(`/api/spending/report/${userId}`);
  }

  // Get Missions
  async getMissions(userId: string): Promise<{ missions: Mission[] }> {
    return this.request(`/api/missions/${userId}`);
  }

  // Complete Mission
  async completeMission(
    missionId: string,
    userId: string
  ): Promise<{ mission: Mission; streak: UserStreak; shark_level: number }> {
    return this.request(`/api/missions/${missionId}/complete`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // Get Shark Status
  async getSharkStatus(userId: string): Promise<{
    shark_level: number;
    current_streak: number;
    total_missions: number;
    next_level_at: number;
    progress: number;
  }> {
    return this.request(`/api/shark/${userId}`);
  }

  // Get Dashboard
  async getDashboard(userId: string): Promise<{
    user_profile: unknown;
    goals: FinancialGoal[];
    missions: Mission[];
    streak: UserStreak;
    spending_summary: unknown;
  }> {
    return this.request(`/api/dashboard/${userId}`);
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health");
  }
}

export const api = new ApiService();
export default api;

// Convenience exports for direct function imports
export const goalChat = (
  conversationHistory: Array<{ role: string; content: string }>,
  message: string
) => api.goalPlanningChat(message, conversationHistory);

export const finalizeGoals = (
  userId: string,
  conversationHistory: Array<{ role: string; content: string }>
) => api.finalizeGoals(userId, conversationHistory);

export const creditChat = (userId: string, message?: string) =>
  api.creditOptimizationChat(userId, message);

export const finalizeCreditStack = (userId: string) =>
  api.finalizeCreditStack(userId);
