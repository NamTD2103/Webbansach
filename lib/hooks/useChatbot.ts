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

      // Add user message to UI immediately
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
            contextData: {
              deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP',
              entryPoint: pagePath.includes('/product/')
                ? 'PRODUCT_PAGE'
                : pagePath.includes('/checkout')
                ? 'CHECKOUT'
                : pagePath.includes('/cart')
                ? 'CART_PAGE'
                : 'HOMEPAGE',
              interactionPhase: pagePath.includes('/checkout') ? 'DECISION'
                : pagePath.includes('/product/') ? 'CONSIDERATION'
                : pagePath.includes('/cart') ? 'DECISION'
                : 'DISCOVERY',
              userUrgency: /nhanh|gấp|cấp|vội|ngay|asap/i.test(message) ? 'HIGH' : 'MEDIUM',
              pageContext: pagePath,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          // Update conversation ID if new
          if (!conversation.id && data.data.conversationId) {
            setConversation((prev) => ({
              ...prev,
              id: data.data.conversationId,
            }));

            // Save session token
            localStorage.setItem('chatbot_session', data.data.sessionToken || '');
          }

          // Add bot message
          const botMessage: Message = {
            id: data.data.botMessageId?.toString(),
            type: 'bot',
            content: data.data.response,
            intent: data.data.intent,
            confidence: data.data.confidence,
            timestamp: new Date().toISOString(),
          };

          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, botMessage],
            isLoading: false,
          }));
        } else {
          throw new Error(data.error || 'Failed to get response');
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

        // Update message in state
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
  const loadHistory = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(`/api/chatbot/messages/${conversationId}`);

        if (!response.ok) {
          throw new Error('Failed to load history');
        }

        const data = await response.json();

        if (data.success) {
          const messages: Message[] = data.data.map((msg: any) => ({
            id: msg.MESSAGE_ID?.toString(),
            type: msg.MESSAGE_TYPE,
            content: msg.CONTENT,
            intent: msg.INTENT,
            confidence: msg.CONFIDENCE_SCORE,
            timestamp: msg.CREATED_AT,
            helpful: msg.IS_HELPFUL,
          }));

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
    },
    [],
  );

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
