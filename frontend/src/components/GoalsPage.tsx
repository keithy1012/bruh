import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Target, Calendar, DollarSign, Trash2, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Roadmap } from './Roadmap';
import { useUser } from '../hooks/useUser';
import { api } from '../services/api';
import { FinancialGoal } from '../types';
import React from "react";

export function GoalsPage() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch goals from backend
  useEffect(() => {
    if (!userId) {
      navigate('/onboarding');
      return;
    }

    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        const response = await api.getGoals(userId);
        setGoals(response.goals || []);
      } catch (err: any) {
        if (err.message?.includes('404')) {
          // User not found, redirect to onboarding
          navigate('/onboarding');
          return;
        }
        setError('Failed to load goals');
        console.error('Failed to fetch goals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
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
      console.error('Failed to update goal:', err);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!userId) return;

    try {
      await api.deleteGoal(userId, goalId);
      setGoals(goals.filter(goal => goal.goal_id !== goalId));
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const roadmapGoals = goals.filter(goal => goal.on_roadmap).sort((a, b) => 
    new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-600 mb-4">Start by creating your first financial goal with our AI assistant.</p>
          <Button 
            onClick={() => navigate('/goals/chat')}
            className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Goal
          </Button>
        </Card>
      )}

      {/* Goals Grid */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {goals.map((goal) => {
            const progress = goal.target_amount > 0 
              ? (goal.current_amount / goal.target_amount) * 100 
              : 0;
            
            return (
              <Card key={goal.goal_id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f] flex-shrink-0" />
                      <h3 className="text-sm sm:text-base text-[#1e3a5f] truncate">{goal.title}</h3>
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.goal_id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {goal.description && (
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                  )}

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
                      <span>${goal.current_amount.toLocaleString()} of ${goal.target_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      goal.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : goal.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {goal.priority} priority
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {goal.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={() => toggleRoadmap(goal.goal_id)}
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

      {/* Roadmap Section */}
      {roadmapGoals.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl text-[#1e3a5f] mb-4 sm:mb-6">Your Financial Roadmap</h2>
          <Roadmap goals={roadmapGoals.map(g => ({
            id: g.goal_id,
            title: g.title,
            targetAmount: g.target_amount,
            currentAmount: g.current_amount,
            targetDate: g.target_date,
            category: g.category,
            onRoadmap: g.on_roadmap,
          }))} />
        </div>
      )}
    </div>
  );
}