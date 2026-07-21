import { useState, useCallback, useRef, useEffect } from 'react';

interface Message {
  id?: string;
  type: 'user' | 'bot';
  content: string;
  intent?: string;
  confidence?: number;
  timestamp?: string;
  helpful?: number;
}

interface Conversation {
  id: string;
  messages: Message[];
  isLoading: boolean;
}

/**
 * Hook for managing chatbot state and API interactions
 */
export const useChatbot = (userId?: number | string) => {
  const [conversation, setConversation] = useState<Conversation>({
    id: '',
    messages: [],
    isLoading: false,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages, scrollToBottom]);

  /**
   * Send message to chatbot
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) {
        setError('Message cannot be empty');
        return;
      }

      if (!userId) {
        setError('User session not initialized');
        return;
      }

      setError(null);

      const userMessage: Message = {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };

      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
      }));

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';

        const response = await fetch(`${apiBaseUrl}/chatbot/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            message,
            conversationId: conversation.id,
            sessionToken: localStorage.getItem('chatbot_session') || undefined,
          }),

        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data: unknown = await response.json();
        const d = data as {
          success?: boolean;
          data?: {
            conversationId?: string | number;
            botMessageId?: string | number;
            response?: string;
            intent?: string;
            confidence?: number;
          };
          error?: string;
        };

        if (d.success && d.data) {
          if (!conversation.id && d.data.conversationId !== undefined) {
            setConversation((prev) => ({
              ...prev,
              id: String(d.data!.conversationId),
            }));
            // enhanced backend may return sessionToken; we store it if present
            // (kept as optional to avoid typing issues)
            const sessionToken = (d.data as unknown as { sessionToken?: string | number }).sessionToken;
            if (typeof sessionToken !== 'undefined') {
              localStorage.setItem('chatbot_session', String(sessionToken || ''));
            }
          }

          const botMessage: Message = {
            id: d.data.botMessageId !== undefined ? String(d.data.botMessageId) : undefined,
            type: 'bot',
            content: d.data.response || '',
            intent: d.data.intent,
            confidence: d.data.confidence,
            timestamp: new Date().toISOString(),
          };

          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, botMessage],
            isLoading: false,
          }));
        } else {
          throw new Error((d as { error?: string }).error || 'Failed to get response');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setConversation((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [userId, conversation.id],
  );

  /**
   * Send feedback on a message
   */
  const sendFeedback = useCallback(
    async (messageId: string, helpful: number, feedbackText?: string) => {
      try {
        const response = await fetch('/api/chatbot/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId,
            helpful,
            conversationId: conversation.id,
            feedbackText,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send feedback');
        }

        setConversation((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, helpful } : msg,
          ),
        }));

        return true;
      } catch (err) {
        console.error('Error sending feedback:', err);
        return false;
      }
    },
    [conversation.id],
  );

  /**
   * Load conversation history
   */
  const loadHistory = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chatbot/messages/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to load history');
      }

      const data: unknown = await response.json();
      const d = data as {
        success?: boolean;
        data?: Array<Record<string, unknown>>;
      };

      if (d.success && Array.isArray(d.data)) {
        const messages: Message[] = d.data.map((msg) => {
          const m = msg as Record<string, unknown>;
          const rawType = m.MESSAGE_TYPE;
          return {
            id:
              typeof m.MESSAGE_ID === 'string' || typeof m.MESSAGE_ID === 'number'
                ? String(m.MESSAGE_ID)
                : undefined,
            type:
              rawType === 'user' || rawType === 'bot' ? (rawType as Message['type']) : 'bot',
            content: typeof m.CONTENT === 'string' ? m.CONTENT : '',
            intent: typeof m.INTENT === 'string' ? m.INTENT : undefined,
            confidence: typeof m.CONFIDENCE_SCORE === 'number' ? m.CONFIDENCE_SCORE : undefined,
            timestamp: typeof m.CREATED_AT === 'string' ? m.CREATED_AT : undefined,
            helpful: typeof m.IS_HELPFUL === 'number' ? m.IS_HELPFUL : undefined,
          };
        });

        setConversation((prev) => ({
          ...prev,
          id: conversationId,
          messages,
        }));
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load conversation history');
    }
  }, []);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(() => {
    setConversation({
      id: '',
      messages: [],
      isLoading: false,
    });
    setError(null);
  }, []);

  /**
   * Toggle chatbot visibility
   */
  const toggleChatbot = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    conversation,
    isOpen,
    error,
    messagesEndRef,
    sendMessage,
    sendFeedback,
    loadHistory,
    clearConversation,
    toggleChatbot,
  };
};

