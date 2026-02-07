import { useState } from 'react';
import { TrendingUp, CreditCard, CheckCircle, Circle, AlertCircle, Sparkles, Check } from 'lucide-react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import React from "react";

interface CreditCardRecommendation {
  name: string;
  issuer: string;
  imageUrl: string;
  annualFee: number;
  benefits: string[];
  personalizedReason: string;
  recommendedUse: string;
}

export function CreditPage() {
  const [creditScore] = useState(720);
  const [userGoals, setUserGoals] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const creditFactors = [
    { label: 'Payment History', score: 95, status: 'excellent', impact: 'High Impact' },
    { label: 'Credit Utilization', score: 65, status: 'good', impact: 'High Impact' },
    { label: 'Credit Age', score: 80, status: 'good', impact: 'Medium Impact' },
    { label: 'Credit Mix', score: 70, status: 'good', impact: 'Low Impact' },
    { label: 'New Credit', score: 85, status: 'excellent', impact: 'Low Impact' },
  ];

  const milestones = [
    { score: 650, label: 'Fair Credit', achieved: true },
    { score: 700, label: 'Good Credit', achieved: true },
    { score: 750, label: 'Very Good Credit', achieved: false },
    { score: 800, label: 'Excellent Credit', achieved: false },
  ];

  const recommendations = [
    {
      title: 'Reduce Credit Utilization',
      description: 'Your credit utilization is at 35%. Try to keep it below 30% to improve your score.',
      priority: 'high',
    },
    {
      title: 'Make On-Time Payments',
      description: 'Continue your excellent payment history. Payment history is the most important factor.',
      priority: 'low',
    },
    {
      title: 'Avoid New Credit Applications',
      description: 'Too many hard inquiries can lower your score. Only apply for credit when necessary.',
      priority: 'medium',
    },
  ];

  const cardRecommendations: CreditCardRecommendation[] = [
    {
      name: 'Premium Travel Rewards',
      issuer: 'Chase',
      imageUrl: 'https://images.unsplash.com/photo-1765446904833-6431fecb1706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVkaXQlMjBjYXJkJTIwcHJlbWl1bSUyMGJsYWNrfGVufDF8fHx8MTc3MDQwMzk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      annualFee: 95,
      benefits: [
        '3x points on travel and dining',
        '50,000 bonus points after $4,000 spend',
        'No foreign transaction fees',
        'Travel insurance included',
        'Priority boarding benefits',
      ],
      personalizedReason: 'Based on your Europe vacation goal, this card will help you earn points faster on travel expenses and provides valuable travel insurance.',
      recommendedUse: 'Use for all travel bookings and dining to maximize points toward your vacation goal',
    },
    {
      name: 'Everyday Cashback Plus',
      issuer: 'American Express',
      imageUrl: 'https://images.unsplash.com/photo-1687720106084-d6e235ad226c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXNoYmFjayUyMGNyZWRpdCUyMGNhcmQlMjBibHVlfGVufDF8fHx8MTc3MDQwMzk1Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      annualFee: 0,
      benefits: [
        '3% cashback on groceries',
        '2% cashback on gas',
        '1% cashback on everything else',
        '$200 welcome bonus',
        'No annual fee',
      ],
      personalizedReason: 'With your emergency fund goal, this no-fee card helps you save money while earning cashback on everyday purchases.',
      recommendedUse: 'Primary card for groceries and gas to build your emergency fund faster',
    },
    {
      name: 'Business Rewards Gold',
      issuer: 'Capital One',
      imageUrl: 'https://images.unsplash.com/photo-1543699565-003b8adda5fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNyZWRpdCUyMGNhcmQlMjBnb2xkfGVufDF8fHx8MTc3MDQwMzk1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      annualFee: 0,
      benefits: [
        '2% cashback on all purchases',
        'Unlimited 2% with no categories',
        'Employee card at no extra cost',
        'Free credit score monitoring',
        'Extended warranty protection',
      ],
      personalizedReason: 'Perfect for consolidating expenses and tracking spending for your car down payment goal with simple, unlimited rewards.',
      recommendedUse: 'Use for large purchases and monthly bills to steadily build savings',
    },
  ];

  const handleGetRecommendations = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowRecommendations(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Credit Journey</h1>
        <p className="text-sm sm:text-base text-gray-600">Track and improve your credit score</p>
      </div>

      {/* Credit Score Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-1 p-6 sm:p-8 bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] text-white">
          <div className="text-center space-y-4">
            <h3 className="text-base sm:text-lg opacity-90">Your Credit Score</h3>
            
            {/* Credit Score Circle */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="35%"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="35%"
                  stroke="white"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${(creditScore / 850) * 502.4} 502.4`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl sm:text-5xl">{creditScore}</div>
                <div className="text-xs sm:text-sm opacity-90">out of 850</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Good Credit</span>
            </div>
          </div>
        </Card>

        {/* Credit Journey Milestones */}
        <Card className="lg:col-span-2 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4 sm:mb-6">Your Credit Milestones</h3>
          
          <div className="space-y-4 sm:space-y-6">
            {milestones.map((milestone) => (
              <div key={milestone.score} className="flex items-center gap-3 sm:gap-4">
                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                  milestone.achieved 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {milestone.achieved ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm sm:text-base ${milestone.achieved ? 'text-[#1e3a5f]' : 'text-gray-500'}`}>
                      {milestone.label}
                    </span>
                    <span className={`text-sm sm:text-base ${milestone.achieved ? 'text-[#1e3a5f]' : 'text-gray-500'}`}>
                      {milestone.score}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        milestone.achieved ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{ 
                        width: milestone.achieved 
                          ? '100%' 
                          : `${(creditScore / milestone.score) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Card Recommendation Section */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-[#1e3a5f]/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-1">AI Credit Card Advisor</h3>
            <p className="text-xs sm:text-sm text-gray-600">Tell us about your credit card goals and we'll recommend the best cards for you</p>
          </div>
        </div>

        <div className="space-y-4">
          <Textarea
            value={userGoals}
            onChange={(e) => setUserGoals(e.target.value)}
            placeholder="Example: I travel frequently for work and want to maximize rewards on flights and hotels. I also spend a lot on dining and groceries. Looking for cards with good sign-up bonuses..."
            className="min-h-24 sm:min-h-32 text-sm sm:text-base resize-none"
            disabled={isAnalyzing}
          />
          
          <Button
            onClick={handleGetRecommendations}
            disabled={!userGoals.trim() || isAnalyzing}
            className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Personalized Recommendations
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Card Recommendations */}
      {showRecommendations && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl text-[#1e3a5f]">Recommended Cards for You</h3>
            <span className="px-2 py-1 bg-[#1e3a5f] text-white rounded-full text-xs">
              {cardRecommendations.length} Cards
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {cardRecommendations.map((card, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                {/* Card Image */}
                <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                  <ImageWithFallback
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-white">
                    <div className="text-xs sm:text-sm opacity-90">{card.issuer}</div>
                    <h4 className="text-base sm:text-lg mt-1">{card.name}</h4>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {/* Annual Fee */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Annual Fee</span>
                    <span className="text-[#1e3a5f]">
                      {card.annualFee === 0 ? 'No Fee' : `$${card.annualFee}`}
                    </span>
                  </div>

                  {/* Personalized Reason */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#1e3a5f] flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-700">{card.personalizedReason}</p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h5 className="text-sm text-[#1e3a5f] mb-2">Key Benefits</h5>
                    <ul className="space-y-1.5">
                      {card.benefits.slice(0, 4).map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Use */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h5 className="text-xs text-green-900 mb-1">💡 Best Used For:</h5>
                    <p className="text-xs text-green-800">{card.recommendedUse}</p>
                  </div>

                  <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white text-sm">
                    Learn More
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Credit Factors */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4 sm:mb-6">What Affects Your Credit Score</h3>
        
        <div className="space-y-4 sm:space-y-6">
          {creditFactors.map((factor) => (
            <div key={factor.label}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1">
                    <span className="text-sm sm:text-base text-[#1e3a5f]">{factor.label}</span>
                    <span className="text-xs sm:text-sm text-gray-500">{factor.impact}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <Progress value={factor.score} className="h-2" />
                </div>
                <span className={`text-xs sm:text-sm w-12 text-right ${
                  factor.score >= 80 ? 'text-green-600' : 
                  factor.score >= 60 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {factor.score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4">Personalized Recommendations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {recommendations.map((rec, index) => (
            <Card 
              key={index} 
              className={`p-4 sm:p-6 border-l-4 ${
                rec.priority === 'high' 
                  ? 'border-l-red-500 bg-red-50' 
                  : rec.priority === 'medium'
                  ? 'border-l-yellow-500 bg-yellow-50'
                  : 'border-l-green-500 bg-green-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${
                  rec.priority === 'high' 
                    ? 'text-red-600' 
                    : rec.priority === 'medium'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`} />
                <div>
                  <h4 className="text-sm sm:text-base text-[#1e3a5f] mb-2">{rec.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-700">{rec.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
