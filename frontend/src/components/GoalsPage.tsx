import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Calendar, DollarSign, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Roadmap } from './Roadmap';
import { useUser } from '../hooks/useUser';
import { api } from '../services/api';
import { FinancialGoal } from '../types';

export function GoalsPage() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch goals from backend
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      api.getGoals(userId)
        .then((response) => {
          setGoals(response.goals || []);
        })
        .catch((err) => {
          if (err.message?.includes("404")) {
            navigate("/onboarding");
            return;
          }
          setError("Failed to load goals");
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [userId, navigate]);

  const toggleRoadmap = async (goalId: string) => {
    if (!userId) return;
    const goal = goals.find(g => g.goal_id === goalId);
    if (!goal) return;

    try {
      await api.updateGoal(userId, goalId, { on_roadmap: !goal.on_roadmap });
      setGoals(goals.map(g => 
        g.goal_id === goalId ? { ...g, on_roadmap: !g.on_roadmap } : g
      ));
    } catch (err) {
      console.error("Failed to update goal:", err);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!userId) return;

    try {
      await api.deleteGoal(userId, goalId);
      setGoals(goals.filter(g => g.goal_id !== goalId));
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const roadmapGoals = goals
    .filter(goal => goal.on_roadmap)
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    .map(goal => ({
      id: goal.goal_id,
      title: goal.title,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount || 0,
      targetDate: goal.target_date,
      category: goal.category,
      onRoadmap: goal.on_roadmap,
    }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header - Fade in from top */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-down"
        style={{ animationDelay: '0ms' }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Your Financial Goals</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and achieve your financial dreams</p>
        </div>
        
        <Button 
          onClick={() => navigate('/goals/chat')}
          className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Goal
        </Button>
      </div>

      {/* Empty State - Fade in */}
      {goals.length === 0 && (
        <Card className="p-8 text-center animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-600 mb-4">Start by adding your first financial goal</p>
          <Button 
            onClick={() => navigate('/goals/chat')}
            className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Goal
          </Button>
        </Card>
      )}

      {/* Goals Grid - Staggered fade in */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {goals.map((goal, index) => {
            const currentAmount = goal.current_amount || 0;
            const progress = (currentAmount / goal.target_amount) * 100;
            
            return (
              <Card 
                key={goal.goal_id} 
                className="p-4 sm:p-6 hover:shadow-lg transition-all border-2 border-gray-100 cursor-pointer group animate-fade-in-up hover:scale-[1.02]"
                style={{ animationDelay: `${100 + index * 75}ms` }}
              >
                <div className="space-y-3 sm:space-y-4">
                  {/* Clickable area for navigation */}
                  <div 
                    onClick={() => navigate(`/goals/${goal.goal_id}`)}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f] flex-shrink-0" />
                        <h3 className="text-sm sm:text-base text-[#1e3a5f] truncate group-hover:underline">{goal.title}</h3>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGoal(goal.goal_id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-[#1e3a5f]">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#1e3a5f] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>${currentAmount.toLocaleString()} of ${goal.target_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRoadmap(goal.goal_id);
                      }}
                      variant={goal.on_roadmap ? "default" : "outline"}
                      className={`flex-1 text-xs sm:text-sm ${
                        goal.on_roadmap 
                          ? 'bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white' 
                          : 'border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50'
                      }`}
                    >
                      {goal.on_roadmap ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">On Roadmap</span>
                          <span className="sm:hidden">Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Add to Roadmap</span>
                          <span className="sm:hidden">Add</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Roadmap Section - Fade in from bottom */}
      {roadmapGoals.length > 0 && (
        <div 
          className="mt-8 sm:mt-12 animate-fade-in-up"
          style={{ animationDelay: `${100 + goals.length * 75 + 100}ms` }}
        >
          <h2 className="text-xl sm:text-2xl text-[#1e3a5f] mb-4 sm:mb-6">Your Financial Roadmap</h2>
          <Roadmap goals={roadmapGoals} />
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-down {
          animation: fadeInDown 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}