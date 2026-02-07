import { useState, useCallback } from "react";
import type { ChatMessage } from "../types";

interface UseChatOptions {
  onSend: (
    message: string | undefined,
    history: ChatMessage[]
  ) => Promise<{ response: string; conversation_history: ChatMessage[] }>;
}

export function useChat({ onSend }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (message?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await onSend(message, messages);
        setMessages(result.conversation_history);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [messages, onSend]
  );

  const startConversation = useCallback(async () => {
    return sendMessage(undefined);
  }, [sendMessage]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    startConversation,
    resetChat,
  };
}

export default useChat;
