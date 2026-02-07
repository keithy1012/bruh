import { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, TrendingUp, ShoppingCart, Coffee, Car, Home, Zap, Plus, Lightbulb, Upload } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import React from "react";
import { api } from '../services/api';
import { useUser } from '../hooks/useUser';

// Icon mapping
const iconMap = {
  Home: Home,
  Car: Car,
  ShoppingCart: ShoppingCart,
  Coffee: Coffee,
  Zap: Zap,
  DollarSign: DollarSign,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  Lightbulb: Lightbulb,
};
interface BudgetApiResponse {
  has_data: boolean;
  message?: string;
  period?: string;
  summary?: {
    income: number;
    expenses: number;
    savings: number;
  };
  spending_categories?: {
    name: string;
    amount: number;
    color: string;
    icon: string;
  }[];
  insights?: {
    title: string;
    description: string;
    type: 'positive' | 'warning' | 'suggestion';
    icon: string;
  }[];
  recent_transactions?: {
    date: string;
    description: string;
    category: string;
    amount: number;
  }[];
  optimization_score?: number;
}

interface BudgetData {
  period: string;
  summary: {
    income: number;
    expenses: number;
    savings: number;
  };
  spending_categories: {
    name: string;
    amount: number;
    color: string;
    icon: string;
  }[];
  insights: {
    title: string;
    description: string;
    type: 'positive' | 'warning' | 'suggestion';
    icon: string;
  }[];
  recent_transactions: {
    date: string;
    description: string;
    category: string;
    amount: number;
  }[];
  optimization_score: number;
}

export function BudgetPage() {
  const { userId } = useUser();
  const [selectedMonth] = useState('February 2026');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);

  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      const data = await api.getBudgetData(userId);
      try {
        
        if (data.has_data && data.summary && data.spending_categories) {
          setBudgetData({
            period: data.period ?? selectedMonth,
            summary: data.summary,
            spending_categories: data.spending_categories,
            insights: data.insights ?? [],
            recent_transactions: data.recent_transactions ?? [],
            optimization_score: data.optimization_score ?? 0,
          });
          setHasData(true);
        } else {
          setHasData(false);
          setBudgetData(null);
        }
      } catch (error) {
        console.error('Failed to fetch budget data:', error);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgetData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-[#1e3a5f]">Loading your budget data...</div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e3a5f] rounded-full mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">No Budget Data Yet</h2>
          <p className="text-gray-600 mb-6">
            Upload a CSV of your bank transactions during onboarding to see your personalized budget analysis and insights.
          </p>
          <Button className="bg-[#1e3a5f] hover:bg-[#2d4f7f]">
            Go to Settings to Upload
          </Button>
        </Card>
      </div>
    );
  }
  if (!budgetData) return null;
  const { summary, spending_categories, insights, recent_transactions } = budgetData;

  // Calculate total expenses for percentages
  const expenseCategories = spending_categories.filter(
    (cat) => cat.amount < 0 || cat.name !== 'Income'
  );
  const totalExpenses = expenseCategories.reduce(
    (sum, cat) => sum + cat.amount,
    0
  );

  // Map spending categories with proper icons
  const spendingCategoriesWithIcons = spending_categories.map(cat => ({
    ...cat,
    icon: iconMap[cat.icon] || DollarSign
  }));
  const expenseCategoriesWithIcons = expenseCategories.map(cat => ({
    ...cat,
    icon: iconMap[cat.icon] || DollarSign
  }));

  // Map insights with proper icons
  const insightsWithIcons = insights.map(insight => ({
    ...insight,
    icon: iconMap[insight.icon] || Lightbulb
  }));
  

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f] mb-2">Budget & Savings</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your spending and optimize your savings</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs sm:text-sm text-gray-500">Current Period</div>
          <div className="text-base sm:text-lg font-semibold text-[#1e3a5f]">{budgetData.period || selectedMonth}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Income</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">${summary.income.toLocaleString()}</div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Expenses</span>
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">${summary.expenses.toLocaleString()}</div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Savings</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold">${summary.savings.toLocaleString()}</div>
          <div className="text-xs sm:text-sm opacity-90 mt-1">
            {summary.income > 0 ? ((summary.savings / summary.income) * 100).toFixed(0) : 0}% savings rate
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Spending by Category */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f] mb-4 sm:mb-6">Spending by Category</h3>
          
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoriesWithIcons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={window.innerWidth < 640 ? 70 : 100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expenseCategoriesWithIcons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            {expenseCategoriesWithIcons.map((category, index) => {
              const Icon = category.icon;
              const percentage = (category.amount / totalExpenses) * 100;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xs sm:text-base text-[#1e3a5f]">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-semibold text-[#1e3a5f]">${category.amount.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{percentage.toFixed(0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Optimization Score */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f] mb-4 sm:mb-6">Financial Health Score</h3>
          
          <div className="flex items-center justify-center h-64 sm:h-80">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-48 h-48 sm:w-64 sm:h-64">
                  <circle
                    className="text-gray-200"
                    strokeWidth="16"
                    stroke="currentColor"
                    fill="transparent"
                    r="80"
                    cx="50%"
                    cy="50%"
                  />
                  
                  <circle
                    className="text-[#1e3a5f]"
                    strokeWidth="16"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - budgetData.optimization_score / 100)}`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="80"
                    cx="50%"
                    cy="50%"
                    transform="rotate(-90 96 96)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl sm:text-5xl font-bold text-[#1e3a5f]">
                    {budgetData.optimization_score.toFixed(0)}
                  </div>
                  <div className="text-sm sm:text-base text-gray-500">out of 100</div>
                </div>
              </div>
              <p className="mt-6 text-sm sm:text-base text-gray-600 max-w-xs mx-auto">
                Your financial optimization score based on spending patterns and savings rate
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Personalized Insights */}
      {insightsWithIcons.length > 0 && (
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f] mb-4">Personalized Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {insightsWithIcons.map((insight, index) => {
              const Icon = insight.icon;
              const colorClasses = {
                positive: 'border-l-green-500 bg-green-50',
                warning: 'border-l-yellow-500 bg-yellow-50',
                suggestion: 'border-l-blue-500 bg-blue-50',
              };
              const iconColorClasses = {
                positive: 'text-green-600',
                warning: 'text-yellow-600',
                suggestion: 'text-blue-600',
              };
              
              return (
                <Card
                  key={index}
                  className={`p-4 sm:p-6 border-l-4 ${colorClasses[insight.type]}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-0.5 ${iconColorClasses[insight.type]}`} />
                    <div>
                      <h4 className="text-sm sm:text-base font-semibold text-[#1e3a5f] mb-2">{insight.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-700">{insight.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recent_transactions && recent_transactions.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f]">Recent Transactions</h3>
            <Button className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white w-full sm:w-auto text-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>

          <div className="space-y-1">
            {recent_transactions.map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-gray-500 w-12 sm:w-16 flex-shrink-0">{transaction.date}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm sm:text-base text-[#1e3a5f] truncate font-medium">{transaction.description}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{transaction.category}</div>
                  </div>
                </div>
                <div className={`text-base sm:text-lg font-semibold flex-shrink-0 ml-2 ${
                  transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}