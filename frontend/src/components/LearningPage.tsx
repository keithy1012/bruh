import { useState } from 'react';
import { Search, MessageSquare, BookOpen, TrendingUp, Shield, Wallet, Home, GraduationCap } from 'lucide-react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import React from "react";


export function LearningPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'bot'; message: string }>>([
    { role: 'bot', message: "Hi! I'm your financial advisor. Ask me anything about personal finance!" }
  ]);
  const [chatInput, setChatInput] = useState('');

  const topics = [
    { icon: Wallet, title: 'Budgeting Basics', color: 'bg-blue-100 text-blue-600', count: 12 },
    { icon: TrendingUp, title: 'Investing 101', color: 'bg-green-100 text-green-600', count: 18 },
    { icon: Shield, title: 'Insurance', color: 'bg-purple-100 text-purple-600', count: 8 },
    { icon: Home, title: 'Home Buying', color: 'bg-orange-100 text-orange-600', count: 15 },
    { icon: GraduationCap, title: 'Student Loans', color: 'bg-pink-100 text-pink-600', count: 10 },
  ];

  const faqs = [
    {
      category: 'Budgeting',
      question: 'How much should I save each month?',
      answer: 'A good rule of thumb is the 50/30/20 rule: 50% of your income for needs, 30% for wants, and 20% for savings and debt repayment. However, this can be adjusted based on your personal situation and goals.',
    },
    {
      category: 'Budgeting',
      question: 'What is an emergency fund and how much should I have?',
      answer: 'An emergency fund is money set aside for unexpected expenses like medical bills or job loss. Aim for 3-6 months of living expenses. Start small and build it up over time.',
    },
    {
      category: 'Investing',
      question: 'When should I start investing?',
      answer: 'The best time to start investing is as soon as possible to take advantage of compound interest. However, make sure you have an emergency fund and high-interest debt paid off first.',
    },
    {
      category: 'Investing',
      question: 'What is the difference between stocks and bonds?',
      answer: 'Stocks represent ownership in a company and can offer higher returns but with more risk. Bonds are loans to companies or governments that pay regular interest and are generally lower risk but with lower returns.',
    },
    {
      category: 'Credit',
      question: 'How can I improve my credit score?',
      answer: 'Pay bills on time, keep credit utilization below 30%, don\'t close old credit cards, limit new credit applications, and regularly check your credit report for errors.',
    },
    {
      category: 'Credit',
      question: 'What is credit utilization?',
      answer: 'Credit utilization is the ratio of your credit card balances to your credit limits. For example, if you have a $10,000 limit and a $3,000 balance, your utilization is 30%.',
    },
    {
      category: 'Debt',
      question: 'Should I pay off debt or invest?',
      answer: 'Generally, pay off high-interest debt (above 7-8%) before investing. For low-interest debt, you might consider investing while making minimum payments, especially if your employer matches retirement contributions.',
    },
    {
      category: 'Retirement',
      question: 'How much do I need to retire?',
      answer: 'A common guideline is to have 25 times your annual expenses saved by retirement. This is based on the 4% withdrawal rule, which suggests you can safely withdraw 4% of your savings per year.',
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatMessages([...chatMessages, { role: 'user', message: chatInput }]);

    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "That's a great question! Based on your financial profile, I'd recommend...",
        "Let me help you with that. Here's what you should know...",
        "Great question! This is an important topic for your financial health...",
      ];
      
      setChatMessages(prev => [...prev, {
        role: 'bot',
        message: responses[Math.floor(Math.random() * responses.length)]
      }]);
    }, 1000);

    setChatInput('');
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Financial Learning Center</h1>
        <p className="text-sm sm:text-base text-gray-600">Expand your financial knowledge and make informed decisions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <Input
          type="text"
          placeholder="Search for financial topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 text-sm sm:text-base"
        />
      </div>

      {/* Topics Grid */}
      <div>
        <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4">Popular Topics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {topics.map((topic, index) => (
            <Card
              key={index}
              className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-[#1e3a5f]"
            >
              <div className="text-center space-y-2 sm:space-y-3">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${topic.color} flex items-center justify-center mx-auto`}>
                  <topic.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base text-[#1e3a5f] mb-1">{topic.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-500">{topic.count} articles</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4">Frequently Asked Questions</h3>
          
          <Card className="p-4 sm:p-6">
            <Accordion type="single" collapsible>
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a5f] flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">{faq.category}</div>
                        <div className="text-sm sm:text-base text-[#1e3a5f]">{faq.question}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base text-gray-700 pl-6 sm:pl-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm sm:text-base">
                No questions found matching your search.
              </div>
            )}
          </Card>
        </div>

        {/* AI Assistant Chat */}
        <div className="lg:col-span-1">
          <h3 className="text-lg sm:text-xl text-[#1e3a5f] mb-4">Ask Our AI Assistant</h3>
          
          <Card className="p-4 sm:p-6 h-[400px] sm:h-[600px] flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 sm:p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#1e3a5f] text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.role === 'bot' && (
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs opacity-75">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-xs sm:text-sm">{msg.message}</p>
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
                placeholder="Ask a question..."
                className="flex-1 text-sm sm:text-base"
              />
              <Button
                onClick={handleSendMessage}
                className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}