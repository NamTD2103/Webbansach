'use client';

import React, { useEffect, useState } from 'react';

interface ChatbotStats {
  total_conversations: number;
  total_messages: number;
  unique_users: number;
  avg_messages_per_conv: number;
  satisfied_conversations: number;
}

export const ChatBotStatsAdmin: React.FC = () => {
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/chatbot/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className='p-6 text-center'>
        <p>Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6 bg-red-50 border border-red-200 rounded text-red-800'>
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return <div className='p-6 text-center'>No stats available</div>;
  }

  const satisfactionRate = stats.total_conversations
    ? ((stats.satisfied_conversations / stats.total_conversations) * 100).toFixed(1)
    : 0;

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-bold mb-6'>Chatbot Statistics</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        {/* Total Conversations */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600 mb-2'>Total Conversations</div>
          <div className='text-3xl font-bold text-blue-600'>
            {stats.total_conversations?.toLocaleString() || 0}
          </div>
        </div>

        {/* Total Messages */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600 mb-2'>Total Messages</div>
          <div className='text-3xl font-bold text-green-600'>
            {stats.total_messages?.toLocaleString() || 0}
          </div>
        </div>

        {/* Unique Users */}
        <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600 mb-2'>Unique Users</div>
          <div className='text-3xl font-bold text-purple-600'>
            {stats.unique_users?.toLocaleString() || 0}
          </div>
        </div>

        {/* Avg Messages */}
        <div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600 mb-2'>Avg Messages/Conv</div>
          <div className='text-3xl font-bold text-orange-600'>
            {stats.avg_messages_per_conv?.toFixed(1) || '0.0'}
          </div>
        </div>

        {/* Satisfaction Rate */}
        <div className='bg-pink-50 border border-pink-200 rounded-lg p-4'>
          <div className='text-sm text-gray-600 mb-2'>Satisfaction Rate</div>
          <div className='text-3xl font-bold text-pink-600'>{satisfactionRate}%</div>
        </div>
      </div>

      {/* Additional info */}
      <div className='mt-6 p-4 bg-gray-50 rounded border border-gray-200'>
        <p className='text-sm text-gray-600'>
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};
