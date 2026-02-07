import { useState } from 'react';
import { Plus, MessageSquare, Target, Calendar, DollarSign, Trash2, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Roadmap } from './Roadmap';
import React from "react";


interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  onRoadmap: boolean;
}

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 6500,
      targetDate: '2026-12-31',
      category: 'Savings',
      onRoadmap: true,
    },
    {
      id: '2',
      title: 'New Car Down Payment',
      targetAmount: 8000,
      currentAmount: 2400,
      targetDate: '2027-06-30',
      category: 'Purchase',
      onRoadmap: true,
    },
    {
      id: '3',
      title: 'Vacation to Europe',
      targetAmount: 5000,
      currentAmount: 1200,
      targetDate: '2026-08-15',
      category: 'Travel',
      onRoadmap: false,
    },
  ]);

  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'bot'; message: string }>>([
    { role: 'bot', message: "Hi! I'm your financial goal assistant. What would you like to achieve?" }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, { role: 'user', message: chatInput }]);
    
    // Simulate bot response
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'bot',
        message: "That's a great goal! Based on your current income and expenses, I recommend saving $500/month. Would you like me to create this goal for you?"
      }]);
    }, 1000);

    setChatInput('');
  };

  const toggleRoadmap = (goalId: string) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, onRoadmap: !goal.onRoadmap } : goal
    ));
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const roadmapGoals = goals.filter(goal => goal.onRoadmap).sort((a, b) => 
    new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Your Financial Goals</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and achieve your financial dreams</p>
        </div>
        
        <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-[calc(100%-2rem)]">
            <DialogHeader>
              <DialogTitle className="text-[#1e3a5f]">Goal Assistant</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="h-60 sm:h-80 overflow-y-auto space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2.5 sm:p-3 rounded-lg text-sm sm:text-base ${
                        msg.role === 'user'
                          ? 'bg-[#1e3a5f] text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Describe your goal..."
                  className="flex-1 text-sm sm:text-base"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          
          return (
            <Card key={goal.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow border-2 border-gray-100">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f] flex-shrink-0" />
                    <h3 className="text-sm sm:text-base text-[#1e3a5f] truncate">{goal.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
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
                    <span>${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    onClick={() => toggleRoadmap(goal.id)}
                    variant={goal.onRoadmap ? "default" : "outline"}
                    className={`flex-1 text-xs sm:text-sm ${
                      goal.onRoadmap 
                        ? 'bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white' 
                        : 'border-[#1e3a5f] text-[#1e3a5f] hover:bg-gray-50'
                    }`}
                  >
                    {goal.onRoadmap ? (
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

      {/* Roadmap Section */}
      <div className="mt-8 sm:mt-12">
        <h2 className="text-xl sm:text-2xl text-[#1e3a5f] mb-4 sm:mb-6">Your Financial Roadmap</h2>
        <Roadmap goals={roadmapGoals} />
      </div>
    </div>
  );
}