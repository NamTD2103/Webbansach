'use client';

import React from 'react';
import { ChatBot } from '@/components/ChatBot';

interface RootLayoutContentProps {
  children: React.ReactNode;
  userId?: number | string;
}

/**
 * Client-side layout wrapper that includes ChatBot
 * This component is used in the root layout to add chatbot to all pages
 */
export const RootLayoutContent: React.FC<RootLayoutContentProps> = ({
  children,
  userId,
}) => {
  // Try to get userId from session storage or localStorage
  const sessionUserId = 
    typeof window !== 'undefined' 
      ? localStorage.getItem('user_id') || sessionStorage.getItem('user_id')
      : userId;

  return (
    <>
      {children}
      <ChatBot userId={sessionUserId || userId} position='bottom-right' theme='light' />
    </>
  );
};
