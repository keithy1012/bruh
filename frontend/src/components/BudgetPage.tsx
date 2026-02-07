import { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, ShoppingCart, Coffee, Car, Home, Zap, Plus, Lightbulb } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import React from "react";


export function BudgetPage() {
  const [selectedMonth] = useState('February 2026');

  const summary = {
    income: 5500,
    expenses: 4250,
    savings: 1250,
  };

  const spendingCategories = [
    { name: 'Housing', amount: 1500, color: '#1e3a5f', icon: Home },
    { name: 'Transportation', amount: 650, color: '#2d4f7f', icon: Car },
    { name: 'Food & Dining', amount: 800, color: '#4a6fa5', icon: ShoppingCart },
    { name: 'Entertainment', amount: 350, color: '#6b8fc9', icon: Coffee },
    { name: 'Utilities', amount: 450, color: '#8cafed', icon: Zap },
    { name: 'Other', amount: 500, color: '#b3d1ff', icon: DollarSign },
  ];

  const monthlyTrend = [
    { month: 'Oct', expenses: 4100, savings: 1400 },
    { month: 'Nov', expenses: 4300, savings: 1200 },
    { month: 'Dec', expenses: 4800, savings: 700 },
    { month: 'Jan', expenses: 4200, savings: 1300 },
    { month: 'Feb', expenses: 4250, savings: 1250 },
  ];

  const insights = [
    {
      title: 'Great Progress on Emergency Fund',
      description: 'You\'re on track to complete your Emergency Fund goal 2 months early! Keep up the momentum.',
      type: 'positive',
      icon: TrendingUp,
    },
    {
      title: 'Food & Dining Up 15%',
      description: 'Your food spending increased this month. Consider meal planning to reduce dining out expenses.',
      type: 'warning',
      icon: TrendingDown,
    },
    {
      title: 'Optimize for Car Down Payment',
      description: 'Based on your New Car goal, try reducing entertainment by $100/month to reach your target faster.',
      type: 'suggestion',
      icon: Lightbulb,
    },
  ];

  const recentTransactions = [
    { date: 'Feb 6', description: 'Grocery Store', category: 'Food & Dining', amount: -85.50 },
    { date: 'Feb 5', description: 'Salary Deposit', category: 'Income', amount: 2750.00 },
    { date: 'Feb 4', description: 'Electric Bill', category: 'Utilities', amount: -120.00 },
    { date: 'Feb 3', description: 'Gas Station', category: 'Transportation', amount: -45.00 },
    { date: 'Feb 2', description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99 },
  ];

  const totalExpenses = spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Budget & Savings</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your spending and optimize your savings</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs sm:text-sm text-gray-500">Current Period</div>
          <div className="text-base sm:text-lg text-[#1e3a5f]">{selectedMonth}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Income</span>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-2xl sm:text-3xl">${summary.income.toLocaleString()}</div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Expenses</span>
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-2xl sm:text-3xl">${summary.expenses.toLocaleString()}</div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm opacity-90">Total Savings</span>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-2xl sm:text-3xl">${summary.savings.toLocaleString()}</div>
          <div className="text-xs sm:text-sm opacity-90 mt-1">
            {((summary.savings / summary.income) * 100).toFixed(0)}% savings rate
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Spending by Category */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4 sm:mb-6">Spending by Category</h3>
          
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={window.innerWidth < 640 ? 70 : 100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {spendingCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            {spendingCategories.map((category, index) => {
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
                    <div className="text-sm sm:text-base text-[#1e3a5f]">${category.amount.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm text-gray-500">{percentage.toFixed(0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4 sm:mb-6">Monthly Trend</h3>
          
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Bar dataKey="savings" fill="#1e3a5f" name="Savings" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg. Expenses</div>
              <div className="text-lg sm:text-2xl text-red-600">
                ${Math.round(monthlyTrend.reduce((sum, m) => sum + m.expenses, 0) / monthlyTrend.length).toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg. Savings</div>
              <div className="text-lg sm:text-2xl text-[#1e3a5f]">
                ${Math.round(monthlyTrend.reduce((sum, m) => sum + m.savings, 0) / monthlyTrend.length).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Personalized Insights */}
      <div>
        <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4">Personalized Insights Based on Your Goals</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {insights.map((insight, index) => {
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
                    <h4 className="text-sm sm:text-base text-[#1e3a5f] mb-2">{insight.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-700">{insight.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl text-[#1e3a5f]">Recent Transactions</h3>
          <Button className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white w-full sm:w-auto text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        <div className="space-y-1">
          {recentTransactions.map((transaction, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                <div className="text-xs sm:text-sm text-gray-500 w-12 sm:w-16 flex-shrink-0">{transaction.date}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base text-[#1e3a5f] truncate">{transaction.description}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{transaction.category}</div>
                </div>
              </div>
              <div className={`text-base sm:text-lg flex-shrink-0 ml-2 ${
                transaction.amount > 0 ? 'text-green-600' : 'text-gray-900'
              }`}>
                {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}