import { useState, useRef, useEffect } from "react";
import type { ReactElement } from "react";
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
  TrendingUp,
  Plus
} from "lucide-react";
import { useUser } from "../hooks/useUser";
import { creditChat, finalizeCreditStack, getCreditConversation } from "../services/api";
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

// Helper function to render markdown links in text
function renderMessageWithLinks(text: string) {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the link
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline font-medium"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// Loadout card type for the live preview
interface LoadoutCard {
  name: string;
  issuer?: string;
  reason?: string;
  best_categories?: string[];
  annual_fee?: number;
  url?: string;
}

export function CreditChatPage() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [creditStack, setCreditStack] = useState<CreditCardStack | null>(null);
  const [currentLoadout, setCurrentLoadout] = useState<{ cards: LoadoutCard[], tree_name: string | null }>({ cards: [], tree_name: null });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Rotating loading messages for finalize
  const loadingMessages = [
    "Building your optimal credit stack...",
    "Analyzing your spending patterns...",
    "Matching cards to your lifestyle...",
    "Calculating maximum rewards potential...",
    "Finding the best sign-up bonuses...",
    "Finalizing your recommendations...",
  ];

  // Rotate loading messages while finalizing
  useEffect(() => {
    if (!showTransition) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [showTransition, loadingMessages.length]);

  const scrollToBottom = () => {
    // Only scroll within the messages container, not the whole page
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
      getCreditConversation(userId)
        .then((existingConvo) => {
          // If there's a finalized stack, restore it
          if (existingConvo.finalized_stack) {
            setCreditStack(existingConvo.finalized_stack as CreditCardStack);
            // Also set current loadout from the finalized stack
            if (existingConvo.finalized_stack.cards) {
              setCurrentLoadout({
                cards: existingConvo.finalized_stack.cards,
                tree_name: existingConvo.finalized_stack.tree_name || null
              });
            }
          }
          
          if (existingConvo.conversation_history && existingConvo.conversation_history.length > 0) {
            // Restore existing conversation
            setMessages(existingConvo.conversation_history as ChatMessage[]);
            setIsLoading(false);
          } else {
            // No existing conversation, start a new one
            return creditChat(userId).then((response: any) => {
              setMessages([{ role: "assistant", content: response.response }]);
              if (response.current_loadout) {
                setCurrentLoadout(response.current_loadout);
              }
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
      const response: any = await creditChat(userId, userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response },
      ]);
      // Update the live loadout
      if (response.current_loadout) {
        setCurrentLoadout(response.current_loadout);
      }
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
    setShowTransition(true);
    setIsFinalizing(true);

    try {
      const result = await finalizeCreditStack(userId);
      // Small delay to let the animation complete
      setTimeout(() => {
        setCreditStack(result);
        setCurrentLoadout({ cards: result.cards || [], tree_name: result.tree_name || null });
        setShowTransition(false);
      }, 500);
    } catch (error) {
      console.error("Failed to finalize credit stack:", error);
      setShowTransition(false);
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

  // Chat view
  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl text-[#1e3a5f] mb-2">Build Your Credit Forest</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Tell me about your spending habits and I'll build your perfect card loadout
        </p>
      </div>

      {/* Main Content - Chat and Loadout side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Chat Card - Takes 2 columns on desktop */}
        <Card className="overflow-hidden lg:col-span-2">
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
        <div 
          ref={messagesContainerRef}
          className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
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
                <p className="text-sm whitespace-pre-wrap">
                  {message.role === "assistant" 
                    ? renderMessageWithLinks(message.content)
                    : message.content
                  }
                </p>
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
        </div>
      </Card>

        {/* Credit Card Loadout - Permanent sidebar */}
        <Card className="overflow-hidden h-fit">
          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d4f7f] px-4 py-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-white" />
              <h3 className="font-semibold text-white">Your Card Loadout</h3>
            </div>
            {currentLoadout.tree_name && (
              <p className="text-sm text-white mt-1">🌳 {currentLoadout.tree_name}</p>
            )}
          </div>

          <div className="p-4 space-y-3">
            {currentLoadout.cards.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Chat with the AI advisor to discover cards that match your lifestyle
                </p>
              </div>
            ) : (
              <>
                {currentLoadout.cards.map((card, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1e3a5f] text-sm truncate">{card.name}</p>
                        {card.issuer && (
                          <p className="text-xs text-gray-500">{card.issuer}</p>
                        )}
                        {card.best_categories && card.best_categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.best_categories.slice(0, 2).map((cat, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                              >
                                {cat}
                              </span>
                            ))}
                            {card.best_categories.length > 2 && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                                +{card.best_categories.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Finalize Button in loadout */}
                <Button
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  className="w-full bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white mt-4"
                >
                  {isFinalizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Finalizing Your Credit Forest...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalize Credit Forest
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Finalized Credit Stack Details - Full width below */}
      {creditStack && (
        <>
          {/* Your Credit Card Stack Header */}
          <div className="text-center">
            {creditStack.tree_name && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-3xl">🌳</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">{creditStack.tree_name}</h2>
                <span className="text-3xl">🌳</span>
              </div>
            )}
            <p className="text-sm sm:text-base text-gray-600">
              Your personalized credit card stack based on your lifestyle
            </p>
          </div>

          {/* Recommended Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {creditStack.cards?.map((card, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                {/* Card Header */}
                <div className="relative h-30 sm:h-48 bg-gradient-to-br from-[#1e3a5f] to-[#2d4f7f] p-6">
                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <div className="text-sm text-white/80 mb-1">{card.issuer || "Credit Card"}</div>
                    <h4 className="text-xl sm:text-2xl font-bold leading-tight">{card.name}</h4>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-5 flex-1 flex flex-col">
                  {/* Annual Fee */}
                  <div className="flex items-center justify-between text-sm border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Annual Fee</span>
                    <span className="font-semibold text-[#1e3a5f] text-base">
                      {card.annual_fee === 0 ? 'No Fee' : `$${card.annual_fee || 0}`}
                    </span>
                  </div>

                  {/* Personalized Reason */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#1e3a5f] flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 leading-relaxed">{card.reason}</p>
                    </div>
                  </div>

                  {/* Best Categories */}
                  {card.best_categories && card.best_categories.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-[#1e3a5f] mb-3">Best For</h5>
                      <div className="flex flex-wrap gap-2">
                        {card.best_categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spacer to push button to bottom */}
                  <div className="flex-1" />

                  {/* Apply Button */}
                  {card.url ? (
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2"
                    >
                      <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white py-3">
                        Learn More & Apply
                      </Button>
                    </a>
                  ) : (
                    <Button className="w-full bg-[#1e3a5f] hover:bg-[#2d4f7f] text-white py-3 mt-2">
                      Learn More
                    </Button>
                  )}
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

        </>
      )}

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

      {/* Fullscreen Transition Overlay */}
      {showTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-[#1e3a5f] animate-expand-screen" />
          <div className="relative z-10 text-center animate-fade-in-delayed">
            <Loader2 className="w-16 h-16 animate-spin text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-4">Finalizing...</h2>
            <p 
              key={loadingMessageIndex}
              className="text-white text-lg animate-fade-message"
            >
              {loadingMessages[loadingMessageIndex]}
            </p>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes expandScreen {
          0% {
            clip-path: circle(0% at 50% 100%);
          }
          100% {
            clip-path: circle(150% at 50% 100%);
          }
        }
        
        @keyframes fadeInDelayed {
          0%, 30% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fadeMessage {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        
        .animate-expand-screen {
          animation: expandScreen 0.6s ease-out forwards;
        }
        
        .animate-fade-in-delayed {
          animation: fadeInDelayed 0.8s ease-out forwards;
        }
        
        .animate-fade-message {
          animation: fadeMessage 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default CreditChatPage;
