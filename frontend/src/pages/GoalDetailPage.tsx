import { useState, useEffect, useRef } from "react";
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
  Plus,
  Sprout,
  TreeDeciduous,
  Leaf,
  Apple,
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
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsInput, setSavingsInput] = useState("");
  const [isUpdatingSavings, setIsUpdatingSavings] = useState(false);
  const [showTreeCelebration, setShowTreeCelebration] = useState(false);
  const [celebrationTreeLevel, setCelebrationTreeLevel] = useState<"seed" | "sapling" | "tree" | "appletree">("seed");

  // Rotating loading messages
  const loadingMessages = [
    "Our AI is designing personalized missions to help you reach your goal...",
    "Analyzing your financial profile and timeline...",
    "Crafting actionable steps tailored just for you...",
    "Optimizing mission difficulty and rewards...",
    "Almost there! Finalizing your roadmap...",
    "Adding the finishing touches...",
  ];

  // Rotate loading messages while generating
  useEffect(() => {
    if (!isGenerating) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isGenerating, loadingMessages.length]);

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
        const fetchedMissions = missionsResponse.missions || [];
        setMissions(fetchedMissions);
        
        // If no missions exist, auto-generate them
        if (fetchedMissions.length === 0) {
          setIsGenerating(true);
          try {
            const genResponse = await api.generateGoalMissions(userId, goalId);
            setMissions(genResponse.missions || []);
          } catch (genErr) {
            console.error("Failed to auto-generate missions:", genErr);
          } finally {
            setIsGenerating(false);
          }
        }
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

  // Determine current tree level
  const getTreeLevel = (progress: number): "seed" | "sapling" | "tree" | "appletree" => {
    if (progress < 25) return "seed";
    if (progress < 75) return "sapling";
    if (progress < 100) return "tree";
    return "appletree";
  };

  const currentTreeLevel = getTreeLevel(missionProgress);
  const previousTreeLevelRef = useRef<"seed" | "sapling" | "tree" | "appletree" | null>(null);
  const hasInitializedRef = useRef(false);

  // Check if tree level changed and trigger celebration (only after user action, not on load)
  useEffect(() => {
    if (missions.length === 0) return;
    
    // Skip the initial load - only celebrate after user completes a mission
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      previousTreeLevelRef.current = currentTreeLevel;
      return;
    }
    
    const prevLevel = previousTreeLevelRef.current;
    if (prevLevel && currentTreeLevel !== prevLevel) {
      // Tree grew! Show celebration
      const levelOrder = { seed: 0, sapling: 1, tree: 2, appletree: 3 };
      if (levelOrder[currentTreeLevel] > levelOrder[prevLevel]) {
        setCelebrationTreeLevel(currentTreeLevel);
        setShowTreeCelebration(true);
        
        // Hide celebration after animation
        setTimeout(() => {
          setShowTreeCelebration(false);
        }, 3000);
      }
    }
    previousTreeLevelRef.current = currentTreeLevel;
  }, [currentTreeLevel, missions.length]);

  // Get tree icon based on mission progress
  const TreeIcon = () => {
    if (missionProgress < 25) {
      return <Sprout className="w-6 h-6" />; // Seed/sprout
    } else if (missionProgress < 75) {
      return <Leaf className="w-6 h-6" />; // Sapling
    } else if (missionProgress < 100) {
      return <TreeDeciduous className="w-6 h-6" />; // Full tree
    } else {
      return <Apple className="w-6 h-6" />; // Apple tree (100% complete)
    }
  };

  const getTreeLabel = () => {
    if (missionProgress < 25) return "Seed";
    if (missionProgress < 75) return "Sapling";
    if (missionProgress < 100) return "Tree";
    return "Apple Tree";
  };

  // Get celebration tree icon (larger version)
  const CelebrationTreeIcon = () => {
    const iconStyle = { width: "160px", height: "160px" };
    if (celebrationTreeLevel === "seed") {
      return <Sprout className="text-white" style={iconStyle} />;
    } else if (celebrationTreeLevel === "sapling") {
      return <Leaf className="text-white" style={iconStyle} />;
    } else if (celebrationTreeLevel === "tree") {
      return <TreeDeciduous className="text-white" style={iconStyle} />;
    } else {
      return <Apple className="text-white" style={iconStyle} />;
    }
  };

  const handleAddSavings = async () => {
    if (!userId || !goalId || !goal) return;
    
    const amountToAdd = parseFloat(savingsInput);
    if (isNaN(amountToAdd) || amountToAdd <= 0) return;

    const newTotal = (goal.current_amount || 0) + amountToAdd;

    setIsUpdatingSavings(true);
    try {
      const response = await api.updateGoal(userId, goalId, { current_amount: newTotal });
      setGoal(response.goal);
      setShowSavingsModal(false);
      setSavingsInput("");
    } catch (err) {
      console.error("Failed to update savings:", err);
    } finally {
      setIsUpdatingSavings(false);
    }
  };

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
      {/* Tree Growth Celebration Overlay */}
      {showTreeCelebration && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(to bottom right, rgba(34, 197, 94, 0.95), rgba(5, 150, 105, 0.95))",
            animation: "expandFromCenter 3s ease-in-out forwards",
          }}
        >
          <div 
            className="flex flex-col items-center gap-6"
            style={{
              animation: "contentExpandIn 0.6s ease-out forwards",
            }}
          >
            <div className="p-8 bg-white/20 rounded-full">
              <CelebrationTreeIcon />
            </div>
            <div className="text-center">
              <h2 
                className="text-4xl font-bold text-white mb-2"
                style={{
                  animation: "textExpandIn 0.6s ease-out 0.2s both",
                }}
              >
                🎉 Congrats! 🎉
              </h2>
              <p 
                className="text-2xl text-white"
                style={{
                  animation: "textExpandIn 0.6s ease-out 0.4s both",
                }}
              >
                {celebrationTreeLevel === "appletree" 
                  ? "You completed all missions! 🍎" 
                  : `Your tree grew to a ${celebrationTreeLevel === "sapling" ? "Sapling" : "Full Tree"}!`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes expandFromCenter {
          0% { 
            clip-path: circle(0% at 50% 50%);
            opacity: 1;
          }
          15% { 
            clip-path: circle(100% at 50% 50%);
            opacity: 1;
          }
          85% { 
            clip-path: circle(100% at 50% 50%);
            opacity: 1;
          }
          100% { 
            clip-path: circle(100% at 50% 50%);
            opacity: 0;
            pointer-events: none;
          }
        }
        @keyframes contentExpandIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes textExpandIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

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
              <TreeIcon />
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
            <Progress value={progress} className="h-2 bg-white/20" indicatorClassName="bg-white" />
          </div>
          {missions.length > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Mission Progress ({completedMissions}/{missions.length})</span>
                <span>{missionProgress.toFixed(0)}%</span>
              </div>
              <Progress value={missionProgress} className="h-2 bg-white/20" indicatorClassName="bg-white" />
            </div>
          )}
          {/* Add Savings Button */}
          <Button
            onClick={() => {
              setSavingsInput("");
              setShowSavingsModal(true);
            }}
            className="w-full mt-2 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Savings
          </Button>
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
        </div>

        {/* No Missions State - Show loading hint since missions are auto-generated */}
        {missions.length === 0 && !isGenerating && (
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading missions...
            </h3>
            <p className="text-gray-600">
              Your personalized mission roadmap is being prepared
            </p>
          </Card>
        )}

        {/* Generating State */}
        {isGenerating && missions.length === 0 && (
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-[#1e3a5f] animate-spin mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Creating Your Mission Roadmap
            </h3>
            <p 
              key={loadingMessageIndex}
              className="text-gray-600 animate-fade-message"
            >
              {loadingMessages[loadingMessageIndex]}
            </p>
            <style>{`
              @keyframes fadeMessage {
                0% { opacity: 0; transform: translateY(10px); }
                15% { opacity: 1; transform: translateY(0); }
                85% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-10px); }
              }
              .animate-fade-message {
                animation: fadeMessage 3.5s ease-in-out;
              }
            `}</style>
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

      {/* Savings Update Modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-4">
              Add to Your Savings
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              How much more have you saved towards "{goal.title}"?
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Current savings: <span className="font-medium text-[#1e3a5f]">${currentAmount.toLocaleString()}</span>
            </p>
            <div className="flex items-center mb-4">
              <span className="px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                $
              </span>
              <input
                type="number"
                value={savingsInput}
                onChange={(e) => setSavingsInput(e.target.value)}
                placeholder="0.00"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent outline-none"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Target: ${goal.target_amount.toLocaleString()} • Remaining: ${Math.max(0, goal.target_amount - currentAmount).toLocaleString()}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSavingsModal(false);
                  setSavingsInput("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSavings}
                disabled={isUpdatingSavings || !savingsInput || parseFloat(savingsInput) <= 0}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
              >
                {isUpdatingSavings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add Savings"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default GoalDetailPage;
