import { Calendar, DollarSign, Flag, MapPin, Star, Trophy } from 'lucide-react';
import React from "react";


interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
}

interface RoadmapProps {
  goals: Goal[];
}

export function Roadmap({ goals }: RoadmapProps) {
  if (goals.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-8 sm:p-12 text-center border-2 border-dashed border-gray-300">
        <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-sm sm:text-base text-gray-500">No goals added to your roadmap yet. Add goals to start your financial journey!</p>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 sm:p-8 overflow-hidden">
      {/* Decorative Map Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Grid Pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Journey Path */}
      <div className="relative">
        {/* Curved Road Path for larger screens */}
        <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          <defs>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#1e3a5f', stopOpacity: 0.3 }} />
              <stop offset="50%" style={{ stopColor: '#2d4f7f', stopOpacity: 0.4 }} />
              <stop offset="100%" style={{ stopColor: '#1e3a5f', stopOpacity: 0.3 }} />
            </linearGradient>
          </defs>
          {goals.map((_, index) => {
            if (index === goals.length - 1) return null;
            const yStart = (index + 1) * (100 / (goals.length + 1));
            const yEnd = (index + 2) * (100 / (goals.length + 1));
            const xStart = index % 2 === 0 ? 15 : 85;
            const xEnd = (index + 1) % 2 === 0 ? 15 : 85;
            const controlX = (xStart + xEnd) / 2;
            
            return (
              <path
                key={index}
                d={`M ${xStart}% ${yStart}% Q ${controlX}% ${(yStart + yEnd) / 2}%, ${xEnd}% ${yEnd}%`}
                stroke="url(#roadGradient)"
                strokeWidth="6"
                strokeDasharray="10,5"
                fill="none"
              />
            );
          })}
        </svg>

        {/* Mobile: Straight Vertical Line */}
        <div className="md:hidden absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1e3a5f] via-[#2d4f7f] to-[#1e3a5f] opacity-30 rounded-full"></div>

        <div className="relative space-y-6 sm:space-y-8" style={{ zIndex: 1 }}>
          {goals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const monthsRemaining = Math.ceil(
              (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)
            );
            const isCompleted = progress >= 100;
            const isAlternate = index % 2 === 1;

            return (
              <div
                key={goal.id}
                className={`relative flex ${isAlternate ? 'md:flex-row-reverse' : 'flex-row'} items-start gap-4 sm:gap-6`}
              >
                {/* Spacer for desktop alternating layout */}
                <div className="hidden md:block md:w-5/12"></div>

                {/* Milestone Marker */}
                <div className="relative flex-shrink-0 z-10">
                  <div className="relative">
                    {/* Outer Glow Ring */}
                    <div className={`absolute inset-0 rounded-full ${
                      isCompleted ? 'bg-yellow-400' : 'bg-[#1e3a5f]'
                    } opacity-20 blur-lg scale-150`}></div>
                    
                    {/* Main Marker */}
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-xl ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 ring-4 ring-yellow-200' 
                        : 'bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] ring-4 ring-blue-200'
                    }`}>
                      {isCompleted ? (
                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
                      ) : (
                        <div className="text-center text-white">
                          <MapPin className="w-6 h-6 sm:w-7 sm:h-7 mx-auto" />
                          <div className="text-xs mt-1">{index + 1}</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Circle */}
                    {!isCompleted && (
                      <svg className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="45%"
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${progress * 2.5} 250`}
                          strokeLinecap="round"
                          opacity="0.8"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Floating Stars for completed goals */}
                  {isCompleted && (
                    <>
                      <Star className="absolute -top-2 -right-2 w-5 h-5 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '0s' }} />
                      <Star className="absolute -bottom-2 -left-2 w-4 h-4 text-yellow-400 fill-yellow-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </>
                  )}
                </div>

                {/* Content Card */}
                <div className={`flex-1 md:w-5/12 ${isAlternate ? 'md:pr-8' : 'md:pl-0'}`}>
                  <div className={`relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
                    isCompleted ? 'border-yellow-400' : 'border-[#1e3a5f]/20'
                  }`}>
                    {/* Category Badge */}
                    <div className="absolute top-0 right-0">
                      <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-bl-xl text-xs sm:text-sm ${
                        isCompleted 
                          ? 'bg-yellow-400 text-yellow-900' 
                          : 'bg-[#1e3a5f] text-white'
                      }`}>
                        {goal.category}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      {/* Header */}
                      <div className="pr-20">
                        <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-1">{goal.title}</h3>
                        {isCompleted && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Flag className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Goal Reached! 🎉</span>
                          </div>
                        )}
                      </div>

                      {/* Amount Display */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs sm:text-sm text-gray-500 mb-1">Target Amount</div>
                          <div className="text-xl sm:text-2xl text-[#1e3a5f]">
                            ${goal.targetAmount.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm text-gray-500 mb-1">Saved</div>
                          <div className={`text-lg sm:text-xl ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                            ${goal.currentAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className={isCompleted ? 'text-green-600' : 'text-[#1e3a5f]'}>
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted 
                                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                : 'bg-gradient-to-r from-[#1e3a5f] to-[#2d4f7f]'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          >
                            {/* Shimmer effect */}
                            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Target:</span>
                          <span>{new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {!isCompleted && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            {monthsRemaining} months left
                          </div>
                        )}
                      </div>

                      {/* Recommendation */}
                      {!isCompleted && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs sm:text-sm text-[#1e3a5f]">
                            <strong>💡 Tip:</strong> Save ${Math.ceil((goal.targetAmount - goal.currentAmount) / Math.max(monthsRemaining, 1))}/month to reach your goal on time
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Journey End Marker */}
          <div className="flex items-center justify-center pt-6 sm:pt-8">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl ring-4 ring-purple-200">
                <div className="text-center text-white">
                  <Star className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 fill-white" />
                  <div className="text-xs sm:text-sm">Journey</div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 blur-xl scale-150 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
