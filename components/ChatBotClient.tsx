'use client';

import dynamic from 'next/dynamic';

// Dynamic import with ssr: false (allowed in Client Components)
const ChatBotWrapper = dynamic(() => import('./ChatBotWrapper'), {
  ssr: false,
  loading: () => null,
});

export function ChatBotClient() {
  return <ChatBotWrapper />;
}
