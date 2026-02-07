import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { api } from "../services/api";
import { ChatMessage, FinancialGoal } from "../types";
import { Button } from "../components/ui/button";

export function GoalChatPage() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [goals, setGoals] = useState<FinancialGoal[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation - first try to get existing, then start new if empty
  useEffect(() => {
    if (userId && !initialized) {
      setInitialized(true);
      setIsLoading(true);
      
      // First, try to get existing conversation
      api.getGoalConversation(userId)
        .then((existingConvo) => {
          if (existingConvo.conversation_history && existingConvo.conversation_history.length > 0) {
            // Restore existing conversation
            setMessages(existingConvo.conversation_history as ChatMessage[]);
            setIsLoading(false);
          } else {
            // No existing conversation, start a new one
            return api.goalPlanningChat(userId).then((response) => {
              setMessages([{ role: "assistant", content: response.response }]);
            });
          }
        })
        .catch((error) => {
          // If user not found (404), redirect to onboarding
          if (error.message?.includes("404") || error.message?.includes("not found")) {
            navigate("/onboarding");
            return;
          }
          setMessages([
            {
              role: "assistant",
              content: "Hi! I'm here to help you set your financial goals. What would you like to work towards?",
            },
          ]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [userId, initialized, navigate]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !userId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.goalPlanningChat(userId, userMessage);
      setMessages(response.conversation_history as ChatMessage[]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!userId) return;
    setIsFinalizing(true);

    try {
      const result = await api.finalizeGoals(userId);
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
                key={goal.goal_id || index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{goal.title}</h3>
                  <span className="text-sm text-[#1e3a5f] font-medium">
                    ${goal.target_amount.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Priority: {goal.priority}</span>
                  <span>Target: {new Date(goal.target_date).toLocaleDateString()}</span>
                  <span className="capitalize">{goal.category}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/goals")}
              className="flex-1 bg-[#1e3a5f] text-white py-3 rounded-lg hover:bg-[#2d4f7f] transition-colors"
            >
              View All Goals
            </button>
            <button
              onClick={() => setGoals(null)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Add More Goals
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
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white text-lg h-14 w-48"
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Finalizing...
                </>
              ) : (
                "Finalize"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoalChatPage;
