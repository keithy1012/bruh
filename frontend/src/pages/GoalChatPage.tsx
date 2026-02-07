import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { useUser } from "../hooks/useUser";
import { goalChat, finalizeGoals } from "../services/api";
import { ChatMessage, FinancialGoal } from "../types";

export function GoalChatPage() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [goals, setGoals] = useState<FinancialGoal[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, addMessage } = useChat([
    {
      role: "assistant",
      content: "Hi! I'm here to help you set your financial goals. Let's start by learning a bit about you. What's your age?",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMessage });
    setIsLoading(true);

    try {
      const response = await goalChat(
        messages.map((m) => ({ role: m.role, content: m.content })),
        userMessage
      );
      addMessage({ role: "assistant", content: response.response });
    } catch (error) {
      addMessage({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!userId) return;
    setIsFinalizing(true);

    try {
      const result = await finalizeGoals(
        userId,
        messages.map((m) => ({ role: m.role, content: m.content }))
      );
      setGoals(result.goals);
    } catch (error) {
      console.error("Failed to finalize goals:", error);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (goals) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Financial Goals
            </h2>
          </div>

          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{goal.name}</h3>
                  <span className="text-sm text-[#1e3a5f] font-medium">
                    ${goal.target_amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Priority: {goal.priority}</span>
                  <span>Timeline: {goal.timeline_months} months</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-[#1e3a5f] text-white py-3 rounded-lg hover:bg-[#2d4f7f] transition-colors"
            >
              Continue to Dashboard
            </button>
            <button
              onClick={() => setGoals(null)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Revise Goals
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Goal Planning Assistant
          </h2>
          <p className="text-sm text-gray-500">
            Let's discuss your financial goals
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-[#1e3a5f] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4f7f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleFinalize}
              disabled={messages.length < 4 || isFinalizing}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Goals...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Finalize Goals
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalChatPage;
