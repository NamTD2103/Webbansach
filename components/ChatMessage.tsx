'use client';

import React, { useState } from 'react';

interface ChatMessageProps {
  id?: string;
  type: 'user' | 'bot';
  content: string;
  intent?: string;
  confidence?: number;
  helpful?: number;
  onFeedback?: (messageId: string, helpful: number) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  type,
  content,
  intent,
  confidence,
  helpful,
  onFeedback,
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(helpful || 0);

  const handleFeedback = (value: number) => {
    setFeedbackGiven(value);
    if (onFeedback && id) {
      onFeedback(id, value);
    }
    setTimeout(() => setShowFeedback(false), 1500);
  };

  const isBot = type === 'bot';

  return (
    <div className={`flex gap-3 mb-4 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className='flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold'>
          AI
        </div>
      )}

      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
          isBot
            ? 'bg-gray-100 text-gray-900 rounded-bl-none'
            : 'bg-blue-500 text-white rounded-br-none'
        }`}
      >
        {/* Message content */}
        <p className='text-sm md:text-base whitespace-pre-wrap break-words'>
          {content}
        </p>

        {/* Bot message footer with metadata */}
        {isBot && (intent || confidence) && (
          <div className='mt-2 text-xs text-gray-600 flex gap-2'>
            {intent && <span>🏷️ {intent}</span>}
            {confidence && <span>💡 {(confidence * 100).toFixed(0)}%</span>}
          </div>
        )}

        {/* Feedback buttons for bot messages */}
        {isBot && !showFeedback && (
          <div className='mt-2 flex gap-2'>
            <button
              onClick={() => setShowFeedback(true)}
              className='text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-200 transition'
              title='Was this helpful?'
            >
              👍 Helpful
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className='text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-200 transition'
              title='Not helpful?'
            >
              👎 Not helpful
            </button>
          </div>
        )}

        {/* Feedback input */}
        {isBot && showFeedback && (
          <div className='mt-2 flex gap-2'>
            <button
              onClick={() => handleFeedback(1)}
              className={`text-sm px-3 py-1 rounded transition ${
                feedbackGiven === 1
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-green-300'
              }`}
            >
              👍 Yes
            </button>
            <button
              onClick={() => handleFeedback(-1)}
              className={`text-sm px-3 py-1 rounded transition ${
                feedbackGiven === -1
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-red-300'
              }`}
            >
              👎 No
            </button>
          </div>
        )}

        {/* Feedback confirmation */}
        {isBot && feedbackGiven !== 0 && (
          <p className='mt-2 text-xs text-gray-600'>
            {feedbackGiven > 0 ? '✅ Cảm ơn đánh giá tích cực!' : '✅ Cảm ơn ý kiến!'}
          </p>
        )}
      </div>

      {!isBot && (
        <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-sm font-bold'>
          👤
        </div>
      )}
    </div>
  );
};
