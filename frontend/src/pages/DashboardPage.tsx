import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Target,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { api } from "../services/api";
import { useUser } from "../hooks/useUser";
import type { FinancialGoal, Mission, UserStreak } from "../types";

export function DashboardPage() {
  const { userId } = useUser();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchDashboard = async () => {
      try {
        const data = await api.getDashboard(userId);
        setGoals(data.goals || []);
        setMissions(data.missions || []);
        setStreak(data.streak || null);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Welcome back! Here's your financial overview.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-[#1e3a5f]" />
            <span className="text-sm text-gray-600">Active Goals</span>
          </div>
          <div className="text-2xl font-bold text-[#1e3a5f]">
            {goals.length}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Missions Completed</span>
          </div>
          <div className="text-2xl font-bold text-[#1e3a5f]">
            {streak?.total_missions_completed || 0}
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-[#1e3a5f]">
            {streak?.current_streak || 0} days
          </div>
        </Card>
      </div>

      {/* Goals Overview */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">Your Goals</h2>
          <Link to="/goals">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No goals set yet</p>
            <Link to="/goals">
              <Button className="bg-[#1e3a5f] hover:bg-[#2d4f7f]">
                Set Your First Goal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.goal_id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-sm text-gray-500">
                      ${goal.target_amount.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Missions */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">
            Active Missions
          </h2>
        </div>

        {missions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active missions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {missions
              .filter((m) => m.status === "active")
              .slice(0, 3)
              .map((mission) => (
                <div
                  key={mission.mission_id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{mission.title}</div>
                    <div className="text-sm text-gray-500">
                      {mission.description}
                    </div>
                  </div>
                  <div className="text-sm text-[#1e3a5f] font-medium">
                    +{mission.points} pts
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/credit">
          <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Optimize Your Credit</div>
                <div className="text-sm text-gray-500">
                  Get personalized card recommendations
                </div>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/budget">
          <Card className="p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="font-medium">View Spending Report</div>
                <div className="text-sm text-gray-500">
                  Analyze your spending habits
                </div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default DashboardPage;
