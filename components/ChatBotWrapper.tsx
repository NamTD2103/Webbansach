'use client';

import { useEffect, useState } from 'react';
import { ChatBot } from '@/components/ChatBot';

export default function ChatBotWrapper() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client
    setMounted(true);
    
    // Get userId from localStorage or sessionStorage
    let uid = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
    
    // If no user ID, create anonymous session ID
    if (!uid) {
      uid = localStorage.getItem('anonymous_user_id');
      if (!uid) {
        // Create new anonymous ID based on timestamp + random
        uid = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('anonymous_user_id', uid);
      }
    }
    
    setUserId(uid);
  }, []);

  if (!mounted) return null;

  return (
    <ChatBot 
      userId={userId || 'guest'}
      position="bottom-right"
      theme="light"
    />
  );
}
