/**
 * Enhanced ChatBot Component - Example Implementation
 * Demonstrates how to integrate the new chatbot system
 */

import React, { useState, useEffect, useRef } from 'react';
import { useChatbot } from '@/lib/hooks/useChatbot';

// Detect device type
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'DESKTOP';
  return window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP';
};

// Detect current page/entry point
const getEntryPoint = () => {
  if (typeof window === 'undefined') return 'HOMEPAGE';
  
  const path = window.location.pathname;
  if (path.includes('/product/')) return 'PRODUCT_PAGE';
  if (path.includes('/checkout')) return 'CHECKOUT';
  if (path.includes('/cart')) return 'CART_PAGE';
  return 'HOMEPAGE';
};

// Detect user urgency from message patterns
const detectUrgency = (message: string) => {
  const urgentKeywords = ['nhanh', 'gấp', 'cấp', 'vội', 'ngay', 'asap'];
  const urgent = urgentKeywords.some(kw => message.toLowerCase().includes(kw));
  return urgent ? 'HIGH' : 'MEDIUM';
};

// Detect current phase
const getCurrentPhase = () => {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  
  if (path.includes('/checkout')) return 'DECISION';
  if (path.includes('/product/')) return 'CONSIDERATION';
  if (path.includes('/cart')) return 'DECISION';
  
  return 'DISCOVERY';
};

interface EnhancedChatMessage {
  id?: string;
  type: 'user' | 'bot';
  content: string;
  responseType?: string;
  selectionReason?: string;
  messageId?: number;
  helpfulRating?: number;
  timestamp?: string;
}

interface ConversationContext {
  deviceType: string;
  entryPoint: string;
  interactionPhase: string;
  userUrgency: string;
  conversationId?: number;
  userProfile?: any;
}

export const EnhancedChatBot: React.FC<{ userId?: string }> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<EnhancedChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ConversationContext>({
    deviceType: getDeviceType(),
    entryPoint: getEntryPoint(),
    interactionPhase: getCurrentPhase(),
    userUrgency: 'MEDIUM',
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user profile on mount
  useEffect(() => {
    if (userId && userId !== 'guest') {
      loadUserProfile(userId);
    }
  }, [userId]);

  // Update context when page changes
  useEffect(() => {
    const handleResize = () => {
      setContext(prev => ({
        ...prev,
        deviceType: getDeviceType(),
        entryPoint: getEntryPoint(),
        interactionPhase: getCurrentPhase(),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUserProfile = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbot/profile/${id}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.data);
      }
    } catch (err) {
      console.warn('Could not load user profile:', err);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message to UI
    const userMsg: EnhancedChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Update urgency detection
      const updatedContext = {
        ...context,
        userUrgency: detectUrgency(message),
        conversationId: conversationId || undefined,
      };

      // Send message with context
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || 'guest',
          message,
          conversationId,
          contextData: {
            deviceType: updatedContext.deviceType,
            entryPoint: updatedContext.entryPoint,
            interactionPhase: updatedContext.interactionPhase,
            userUrgency: updatedContext.userUrgency,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Store conversation ID
        if (!conversationId) {
          setConversationId(data.data.conversationId);
        }

        // Add bot message
        const botMsg: EnhancedChatMessage = {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: data.data.response,
          responseType: data.data.responseType,
          selectionReason: data.data.selectionReason,
          messageId: data.data.botMessageId,
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId?: number, helpful?: 1 | -1) => {
    if (!messageId) return;

    try {
      const response = await fetch('/api/chatbot/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          helpful,
          sentiment: helpful === 1 ? 'SATISFIED' : 'UNSATISFIED',
          conversionResult: false, // Set true if user purchased
        }),
      });

      if (response.ok) {
        // Update message rating
        setMessages(prev =>
          prev.map(msg =>
            msg.messageId === messageId
              ? { ...msg, helpfulRating: helpful }
              : msg
          )
        );
      }
    } catch (err) {
      console.error('Feedback error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        title="Open chat"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 max-h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold">Web Bán Sách Support 📚</h3>
              <p className="text-xs opacity-90">
                Chúng tôi sẵn sàng giúp bạn!
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-2xl hover:opacity-70"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-2">👋 Xin chào!</p>
                <p className="text-sm">
                  Bạn có câu hỏi về sách, thanh toán, hoặc giao hàng?
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Metadata for bot messages */}
                    {msg.type === 'bot' && (
                      <div className="mt-2 text-xs opacity-70">
                        <p>Type: {msg.responseType}</p>
                        <p>Reason: {msg.selectionReason}</p>
                        
                        {/* Feedback buttons */}
                        <div className="mt-1 flex gap-2">
                          <button
                            onClick={() =>
                              handleFeedback(msg.messageId, 1)
                            }
                            disabled={msg.helpfulRating === 1}
                            className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
                          >
                            👍 Helpful
                          </button>
                          <button
                            onClick={() =>
                              handleFeedback(msg.messageId, -1)
                            }
                            disabled={msg.helpfulRating === -1}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
                          >
                            👎 Not helpful
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                  <p>Đang soạn thảo...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Hỏi mình gì..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Gửi
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Context: {context.deviceType} | {context.entryPoint}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedChatBot;
