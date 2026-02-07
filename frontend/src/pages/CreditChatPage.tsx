import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  CreditCard, 
  CheckCircle2, 
  Sparkles,
  Check,
  TrendingUp
} from "lucide-react";
import { useUser } from "../hooks/useUser";
import { creditChat, finalizeCreditStack } from "../services/api";
import { CreditCardStack, ChatMessage } from "../types";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";

// Credit factors - these could come from backend in the future
const creditFactors = [
  { label: 'Payment History', score: 95, status: 'excellent', impact: 'High Impact' },
  { label: 'Credit Utilization', score: 65, status: 'good', impact: 'High Impact' },
  { label: 'Credit Age', score: 80, status: 'good', impact: 'Medium Impact' },
  { label: 'Credit Mix', score: 70, status: 'good', impact: 'Low Impact' },
  { label: 'New Credit', score: 85, status: 'excellent', impact: 'Low Impact' },
];

export function CreditChatPage() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [creditStack, setCreditStack] = useState<CreditCardStack | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation by calling the API with no message
  useEffect(() => {
    if (userId && !initialized) {
      setInitialized(true);
      setIsLoading(true);
      creditChat(userId)
        .then((response) => {
          setMessages([{ role: "assistant", content: response.response }]);
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
              content:
                "Hi! I'm here to help you find the perfect credit card stack. What categories do you spend the most on?",
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
      const response = await creditChat(userId, userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response },
      ]);
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
      const result = await finalizeCreditStack(userId);
      setCreditStack(result);
    } catch (error) {
      console.error("Failed to finalize credit stack:", error);
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

  // Results view - show credit stack recommendations
  if (creditStack) {
    return (
      <div className="space-y-6 sm:space-y-8 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Your Credit Card Stack</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Personalized recommendations based on your lifestyle
          </p>
        </div>

        {/* Recommended Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {creditStack.cards?.map((card, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
              {/* Card Header */}
              <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] p-4 sm:p-5">
                <div className="absolute top-4 right-4">
                  <CreditCard className="w-8 h-8 text-white/30" />
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="text-xs sm:text-sm opacity-80">{card.issuer || "Credit Card"}</div>
                  <h4 className="text-base sm:text-lg font-semibold mt-1">{card.name}</h4>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                {/* Annual Fee */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Annual Fee</span>
                  <span className="font-medium text-[#1e3a5f]">
                    {card.annual_fee === 0 ? 'No Fee' : `$${card.annual_fee || 0}`}
                  </span>
                </div>

                {/* Personalized Reason */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#1e3a5f] flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-gray-700">{card.reason}</p>
                  </div>
                </div>

                {/* Best Categories */}
                {card.best_categories && card.best_categories.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-[#1e3a5f] mb-2">Best For</h5>
                    <div className="flex flex-wrap gap-2">
                      {card.best_categories.map((cat, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white text-sm">
                  Learn More
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Strategy Summary */}
        {(creditStack.strategy || creditStack.summary) && (
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-[#1e3a5f]/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-medium text-[#1e3a5f] mb-2">Your Strategy</h3>
                <p className="text-sm text-gray-700">{creditStack.strategy || creditStack.summary}</p>
                {creditStack.total_estimated_annual_value && (
                  <p className="mt-3 text-sm font-medium text-green-700">
                    Estimated Annual Value: ${creditStack.total_estimated_annual_value.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Credit Factors */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-medium text-[#1e3a5f] mb-4 sm:mb-6">
            What Affects Your Credit Score
          </h3>
          
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

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex-1 bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white py-3"
          >
            Continue to Dashboard
          </Button>
          <Button
            onClick={() => {
              setCreditStack(null);
              setMessages([]);
              setInitialized(false);
            }}
            variant="outline"
            className="px-6 py-3"
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Credit Card Advisor</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Tell me about your spending habits and I'll recommend the perfect cards for you
        </p>
      </div>

      {/* AI Chat Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4f7f] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h2 className="font-semibold">AI Credit Card Advisor</h2>
              <p className="text-sm text-white/80">Personalized recommendations</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                    : "bg-white text-gray-900 shadow-sm border border-gray-200"
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
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white">
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
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              onClick={handleFinalize}
              disabled={messages.length < 4 || isFinalizing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isFinalizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Building Stack...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Get My Card Recommendations
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Credit Factors Preview */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-medium text-[#1e3a5f] mb-4 sm:mb-6">
          What Affects Your Credit Score
        </h3>
        
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
    </div>
  );
}

export default CreditChatPage;
