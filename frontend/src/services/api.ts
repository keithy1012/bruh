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

  // Get Goal Conversation History
  async getGoalConversation(
    userId: string
  ): Promise<{ conversation_history: Array<{ role: string; content: string }> }> {
    return this.request(`/api/goals/chat/${userId}`);
  }

  // Goal Planning Chat
  async goalPlanningChat(
    userId: string,
    message?: string
  ): Promise<ChatResponse> {
    return this.request(`/api/goals/chat/${userId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  }

  // Finalize Goals
  async finalizeGoals(userId: string): Promise<{ goals: FinancialGoal[]; message: string }> {
    return this.request(`/api/goals/finalize/${userId}`, {
      method: "POST",
    });
  }

  // Get Goals
  async getGoals(userId: string): Promise<{ goals: FinancialGoal[] }> {
    return this.request(`/api/goals/${userId}`);
  }

  // Update Goal
  async updateGoal(
    userId: string,
    goalId: string,
    data: { current_amount?: number; on_roadmap?: boolean }
  ): Promise<{ goal: FinancialGoal; message: string }> {
    return this.request(`/api/goals/${userId}/${goalId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // Delete Goal
  async deleteGoal(userId: string, goalId: string): Promise<{ message: string }> {
    return this.request(`/api/goals/${userId}/${goalId}`, {
      method: "DELETE",
    });
  }

  // Get Credit Conversation History
  async getCreditConversation(
    userId: string
  ): Promise<{ conversation_history: Array<{ role: string; content: string }> }> {
    return this.request(`/api/credit/chat/${userId}`);
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
export const goalChat = (userId: string, message?: string) =>
  api.goalPlanningChat(userId, message);

export const finalizeGoals = (userId: string) =>
  api.finalizeGoals(userId);

export const getCreditConversation = (userId: string) =>
  api.getCreditConversation(userId);

export const creditChat = (userId: string, message?: string) =>
  api.creditOptimizationChat(userId, message);

export const finalizeCreditStack = (userId: string) =>
  api.finalizeCreditStack(userId);
