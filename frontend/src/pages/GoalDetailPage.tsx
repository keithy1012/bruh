import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Target,
  Calendar,
  DollarSign,
  Loader2,
  Sparkles,
  CheckCircle2,
  Clock,
  Trophy,
  BookOpen,
  PiggyBank,
  TrendingDown,
  Zap,
  BarChart3,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { useUser } from "../hooks/useUser";
import { api } from "../services/api";
import { FinancialGoal, Mission } from "../types";

const missionTypeIcons: Record<string, React.ReactNode> = {
  SAVINGS: <PiggyBank className="w-5 h-5" />,
  SPENDING_REDUCTION: <TrendingDown className="w-5 h-5" />,
  LEARNING: <BookOpen className="w-5 h-5" />,
  CHALLENGE: <Zap className="w-5 h-5" />,
  INVESTMENT: <BarChart3 className="w-5 h-5" />,
};

const missionTypeColors: Record<string, string> = {
  SAVINGS: "bg-green-100 text-green-700 border-green-200",
  SPENDING: "bg-orange-100 text-orange-700 border-orange-200",
  LEARNING: "bg-blue-100 text-blue-700 border-blue-200",
  CHALLENGE: "bg-purple-100 text-purple-700 border-purple-200",
  DEBT: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

export function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { userId } = useUser();

  const [goal, setGoal] = useState<FinancialGoal | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch goal and missions
  useEffect(() => {
    if (!userId || !goalId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch goal details
        const goalResponse = await api.getGoal(userId, goalId);
        setGoal(goalResponse.goal);

        // Fetch existing missions
        const missionsResponse = await api.getGoalMissions(userId, goalId);
        setMissions(missionsResponse.missions || []);
      } catch (err: any) {
        if (err.message?.includes("404")) {
          navigate("/goals");
          return;
        }
        setError("Failed to load goal details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, goalId, navigate]);

  const handleGenerateMissions = async () => {
    if (!userId || !goalId) return;

    setIsGenerating(true);
    try {
      const response = await api.generateGoalMissions(userId, goalId);
      setMissions(response.missions || []);
    } catch (err) {
      console.error("Failed to generate missions:", err);
      setError("Failed to generate missions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleMission = async (mission: Mission) => {
    if (!userId || !goalId) return;

    const newStatus = mission.status === "completed" ? "active" : "completed";
    
    try {
      await api.updateMissionStatus(userId, goalId, mission.mission_id, newStatus);
      // Update local state
      setMissions(prev => 
        prev.map(m => 
          m.mission_id === mission.mission_id 
            ? { ...m, status: newStatus } 
            : m
        )
      );
    } catch (err) {
      console.error("Failed to update mission:", err);
    }
  };

  // Calculate mission-based progress
  const completedMissions = missions.filter(m => m.status === "completed").length;
  const missionProgress = missions.length > 0 
    ? (completedMissions / missions.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">{error || "Goal not found"}</p>
        <Button onClick={() => navigate("/goals")}>Back to Goals</Button>
      </div>
    );
  }

  const currentAmount = goal.current_amount || 0;
  const progress = (currentAmount / goal.target_amount) * 100;
  const targetDate = new Date(goal.target_date);
  const daysUntilGoal = Math.ceil(
    (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/goals")}
        className="flex items-center gap-2 text-gray-600 hover:text-[#1e3a5f] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Goals
      </button>

      {/* Goal Header Card */}
      <Card className="p-6 bg-gradient-to-r from-[#1e3a5f] to-[#2d4f7f] text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{goal.title}</h1>
              <p className="text-white/80 text-sm">{goal.description}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              goal.priority === "high"
                ? "bg-red-500/20 text-red-200"
                : goal.priority === "medium"
                ? "bg-yellow-500/20 text-yellow-200"
                : "bg-green-500/20 text-green-200"
            }`}
          >
            {goal.priority} priority
          </span>
        </div>

        {/* Progress */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Financial Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
          {missions.length > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mission Progress ({completedMissions}/{missions.length})</span>
                <span>{missionProgress.toFixed(0)}%</span>
              </div>
              <Progress value={missionProgress} className="h-2 bg-white/20" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/70 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Current
            </div>
            <div className="text-xl font-bold">
              ${currentAmount.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/70 text-sm mb-1">
              <Target className="w-4 h-4" />
              Target
            </div>
            <div className="text-xl font-bold">
              ${goal.target_amount.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-white/70 text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Days Left
            </div>
            <div className="text-xl font-bold">
              {daysUntilGoal > 0 ? daysUntilGoal : "Past due"}
            </div>
          </div>
        </div>
      </Card>

      {/* Missions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e3a5f]">Mission Roadmap</h2>
          {missions.length === 0 && (
            <Button
              onClick={handleGenerateMissions}
              disabled={isGenerating}
              className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Missions
                </>
              )}
            </Button>
          )}
          {missions.length > 0 && (
            <Button
              onClick={handleGenerateMissions}
              disabled={isGenerating}
              variant="outline"
              className="border-[#1e3a5f] text-[#1e3a5f]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )}
        </div>

        {/* No Missions State */}
        {missions.length === 0 && !isGenerating && (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No missions yet
            </h3>
            <p className="text-gray-600 mb-4">
              Generate a personalized roadmap of missions to help you achieve
              this goal
            </p>
            <Button
              onClick={handleGenerateMissions}
              disabled={isGenerating}
              className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Mission Roadmap
            </Button>
          </Card>
        )}

        {/* Generating State */}
        {isGenerating && missions.length === 0 && (
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-[#1e3a5f] animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Creating Your Mission Roadmap
            </h3>
            <p className="text-gray-600">
              Our AI is designing personalized missions to help you reach your
              goal...
            </p>
          </Card>
        )}

        {/* Missions Timeline */}
        {missions.length > 0 && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            <div className="space-y-4">
              {missions.map((mission, index) => (
                <div key={mission.mission_id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      mission.status === "completed"
                        ? "bg-green-100 border-green-500"
                        : mission.milestone_percent
                        ? "bg-yellow-100 border-yellow-500"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {mission.status === "completed" ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : mission.milestone_percent ? (
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <span className="text-sm font-bold text-gray-500">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Mission Card */}
                  <Card
                    className={`flex-1 p-4 transition-all cursor-pointer hover:shadow-md ${
                      mission.status === "completed" 
                        ? "bg-gray-50 opacity-60" 
                        : "hover:border-[#1e3a5f]/30"
                    }`}
                    onClick={() => handleToggleMission(mission)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            mission.status === "completed"
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300 hover:border-[#1e3a5f]"
                          }`}
                        >
                          {mission.status === "completed" && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span
                          className={`p-1.5 rounded-lg border ${
                            missionTypeColors[mission.mission_type] ||
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {missionTypeIcons[mission.mission_type] || (
                            <Target className="w-5 h-5" />
                          )}
                        </span>
                        <div>
                          <h4 className={`font-medium ${
                            mission.status === "completed" 
                              ? "text-gray-500 line-through" 
                              : "text-gray-900"
                          }`}>
                            {mission.title}
                          </h4>
                          {mission.milestone_percent && (
                            <span className="text-xs text-yellow-600 font-medium">
                              🎉 {mission.milestone_percent}% Milestone
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          mission.status === "completed" 
                            ? "text-gray-400" 
                            : "text-[#1e3a5f]"
                        }`}>
                          +{mission.points} pts
                        </span>
                      </div>
                    </div>

                    <p className={`text-sm mb-3 ${
                      mission.status === "completed" 
                        ? "text-gray-400" 
                        : "text-gray-600"
                    }`}>
                      {mission.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1 text-xs ${
                        mission.status === "completed" 
                          ? "text-gray-400" 
                          : "text-gray-500"
                      }`}>
                        <Clock className="w-3 h-3" />
                        Due: {new Date(mission.deadline).toLocaleDateString()}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          mission.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : mission.status === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {mission.status === "completed" ? "✓ Completed" : mission.status}
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalDetailPage;
