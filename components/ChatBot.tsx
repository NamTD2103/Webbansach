'use client';

import React, { useState, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { useChatbot } from '@/lib/hooks/useChatbot';

interface ChatBotProps {
  userId?: number | string;
  initialMessage?: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark';
}

export const ChatBot: React.FC<ChatBotProps> = ({
  userId,
  initialMessage = 'Xin chào! 👋 Tôi có thể giúp gì cho bạn?',
  position = 'bottom-right',
  theme = 'light',
}) => {
  const [userInput, setUserInput] = useState('');
  const [isClient, setIsClient] = useState(false);
  const {
    conversation,
    isOpen,
    error,
    messagesEndRef,
    sendMessage,
    sendFeedback,
    clearConversation,
    toggleChatbot,
  } = useChatbot(userId);

  // Ensure we're on the client before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      await sendMessage(userInput);
      setUserInput('');
    }
  };

  const handleQuickReply = (text: string) => {
    setUserInput(text);
    // You could also auto-send here if desired
    // sendMessage(text);
  };

  if (!isClient) return null;

  const positionClass =
    position === 'bottom-left'
      ? 'bottom-4 left-4 md:left-6'
      : 'bottom-4 right-4 md:right-6';

  const isDark = theme === 'dark';

  return (
    <div className={positionClass}>
      {/* Chat bubble / toggle button */}
      {!isOpen && (
        <button
          onClick={toggleChatbot}
          className='fixed z-40 p-4 rounded-full shadow-lg hover:shadow-xl transition animate-bounce'
          style={{
            backgroundColor: isDark ? '#1e293b' : '#3b82f6',
            color: 'white',
            bottom: 'inherit',
            right: 'inherit',
            left: 'inherit',
          }}
          title='Open chat'
          aria-label='Open chatbot'
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed z-50 w-96 h-96 md:h-screen md:max-h-96 rounded-lg shadow-2xl flex flex-col ${
            isDark ? 'bg-gray-900' : 'bg-white'
          }`}
          style={{
            bottom: '80px',
            [position === 'bottom-left' ? 'left' : 'right']: '0',
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          {/* Header */}
          <div
            className={`p-4 rounded-t-lg text-white flex justify-between items-center ${
              isDark ? 'bg-gray-800' : 'bg-blue-600'
            }`}
          >
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center'>
                🤖
              </div>
              <div>
                <h3 className='font-bold'>Book Assistant</h3>
                <p className='text-xs opacity-80'>Always here to help</p>
              </div>
            </div>

            <div className='flex gap-2'>
              {conversation.messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className='text-white hover:bg-blue-700 p-2 rounded transition'
                  title='Clear chat'
                  aria-label='Clear conversation'
                >
                  🔄
                </button>
              )}

              <button
                onClick={toggleChatbot}
                className='text-white hover:bg-blue-700 p-2 rounded transition'
                title='Close chat'
                aria-label='Close chatbot'
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              isDark ? 'bg-gray-800' : 'bg-gray-50'
            }`}
          >
            {/* Initial greeting if no messages */}
            {conversation.messages.length === 0 && (
              <ChatMessage
                type='bot'
                content={initialMessage}
                intent='GREETING'
                confidence={1.0}
              />
            )}

            {/* Conversation messages */}
            {conversation.messages.map((msg, index) => (
              <ChatMessage
                key={index}
                id={msg.id}
                type={msg.type}
                content={msg.content}
                intent={msg.intent}
                confidence={msg.confidence}
                helpful={msg.helpful}
                onFeedback={(messageId, helpful) =>
                  sendFeedback(messageId, helpful)
                }
              />
            ))}

            {/* Loading indicator */}
            {conversation.isLoading && (
              <div className='flex justify-start gap-2'>
                <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm'>
                  AI
                </div>
                <div className='bg-gray-100 rounded-lg px-4 py-2 flex gap-1'>
                  <div className='w-2 h-2 rounded-full bg-gray-400 animate-bounce'></div>
                  <div
                    className='w-2 h-2 rounded-full bg-gray-400 animate-bounce'
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className='w-2 h-2 rounded-full bg-gray-400 animate-bounce'
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm'>
                ❌ {error}
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {conversation.messages.length === 0 && (
            <div className='px-4 py-2 flex gap-2 flex-wrap'>
              <button
                onClick={() => handleQuickReply('Gợi ý sách cho tôi')}
                className={`text-xs px-2 py-1 rounded transition ${
                  isDark
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📚 Gợi ý sách
              </button>
              <button
                onClick={() => handleQuickReply('Thanh toán như thế nào?')}
                className={`text-xs px-2 py-1 rounded transition ${
                  isDark
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💳 Thanh toán
              </button>
              <button
                onClick={() => handleQuickReply('Thời gian giao hàng?')}
                className={`text-xs px-2 py-1 rounded transition ${
                  isDark
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📦 Vận chuyển
              </button>
            </div>
          )}

          {/* Input area */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <form onSubmit={handleSendMessage} className='flex gap-2'>
              <input
                type='text'
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder='Nhập tin nhắn...'
                className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                disabled={conversation.isLoading}
              />
              <button
                type='submit'
                disabled={conversation.isLoading || !userInput.trim()}
                className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition'
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Open button positioned fixed */}
      {!isOpen && (
        <style>{`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .animate-bounce {
            animation: bounce 2s infinite;
          }
        `}</style>
      )}
    </div>
  );
};
