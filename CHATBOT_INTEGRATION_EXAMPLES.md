# Chatbot Integration Examples

## 🏠 1. Add Chatbot to Root Layout (Recommended)

**File**: `app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { RootLayoutContent } from "@/components/RootLayoutContent";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebBanSach - Online Book Store",
  description: "Buy books online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* Chatbot appears on all pages */}
        <RootLayoutContent>
          {children}
        </RootLayoutContent>
      </body>
    </html>
  );
}
```

## 📱 2. Add Chatbot to Specific Page

If you want chatbot only on certain pages:

**File**: `app/product/[id]/page.tsx`

```typescript
'use client';

import { ChatBot } from '@/components/ChatBot';
import { useSession } from 'next-auth/react'; // or your auth hook

export default function ProductPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  return (
    <div>
      {/* Your product page content */}
      <ProductDetails />

      {/* Chatbot widget */}
      <ChatBot 
        userId={userId}
        position="bottom-right"
        initialMessage="Có câu hỏi về cuốn sách này? Tôi sẵn sàng giúp! 📚"
      />
    </div>
  );
}
```

## 🛒 3. Integration with Cart Page

**File**: `app/cart/page.tsx`

```typescript
'use client';

import { ChatBot } from '@/components/ChatBot';
import { useCart } from '@/lib/hooks/useCart'; // your cart hook

export default function CartPage() {
  const { user } = useCart();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {/* Cart items */}
        <CartItems />
      </div>

      <aside className="lg:col-span-1">
        {/* Order summary */}
        <OrderSummary />

        {/* Helper chatbot for checkout questions */}
        <div className="mt-8">
          <ChatBot
            userId={user?.id}
            position="bottom-right"
            initialMessage="Câu hỏi về thanh toán, vận chuyển? Hỏi tôi! 🤖"
            theme="light"
          />
        </div>
      </aside>
    </div>
  );
}
```

## 💳 4. Integration with Checkout

**File**: `app/checkout/page.tsx`

```typescript
'use client';

import { ChatBot } from '@/components/ChatBot';
import { useAuth } from '@/lib/hooks/useAuth';

export default function CheckoutPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          {/* Checkout form */}
          <CheckoutForm />
        </div>

        <div>
          {/* Payment summary */}
          <PaymentSummary />
        </div>
      </div>

      {/* Chatbot for payment support */}
      <ChatBot
        userId={user?.id}
        position="bottom-left"
        initialMessage="Hỗ trợ thanh toán: Chúng tôi hỗ trợ COD & Chuyển khoản 💳"
      />
    </div>
  );
}
```

## 🎯 5. Custom Chatbot with Enhanced Features

Create a custom wrapper component:

**File**: `components/ChatBotWithPreferences.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ChatBot } from '@/components/ChatBot';

interface ChatBotWithPreferencesProps {
  userId: number | string;
  suggestedCategory?: string;
}

export const ChatBotWithPreferences: React.FC<ChatBotWithPreferencesProps> = ({
  userId,
  suggestedCategory,
}) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user preferences from API
    const fetchPreferences = async () => {
      try {
        const res = await fetch(`/api/chatbot/preferences/${userId}`);
        const data = await res.json();
        if (data.success) {
          setPreferences(data.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId]);

  const greeting = suggestedCategory
    ? `Bạn quan tâm đến sách ${suggestedCategory}? Tôi có gợi ý cho bạn! 📚`
    : 'Chào bạn! Tôi có thể giúp gì? 👋';

  return (
    <ChatBot
      userId={userId}
      position="bottom-right"
      initialMessage={greeting}
      theme="light"
    />
  );
};
```

**Usage**:

```typescript
import { ChatBotWithPreferences } from '@/components/ChatBotWithPreferences';

export default function HomePage() {
  const userId = 123; // from session

  return (
    <div>
      {/* Page content */}
      <ChatBotWithPreferences userId={userId} suggestedCategory="Lập trình" />
    </div>
  );
}
```

## 📊 6. Admin Dashboard with Chatbot Stats

**File**: `app/admin/chatbot/page.tsx`

```typescript
'use client';

import { ChatBotStatsAdmin } from '@/components/ChatBotStatsAdmin';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';

export default function AdminChatbotPage() {
  const { isAdmin } = useAdminAuth();

  if (!isAdmin) {
    return <div>Access denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Chatbot Management</h1>

        {/* Statistics Dashboard */}
        <ChatBotStatsAdmin />

        {/* Additional Admin Controls */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">FAQ Management</h2>
          <FAQManagement />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Conversation History</h2>
          <ConversationHistory />
        </div>
      </div>
    </div>
  );
}
```

## 🔧 7. Using the Chatbot Hook Directly

For more control, use the `useChatbot` hook:

**File**: `components/CustomChatBot.tsx`

```typescript
'use client';

import { useChatbot } from '@/lib/hooks/useChatbot';
import { ChatMessage } from '@/components/ChatMessage';

export const CustomChatBot: React.FC<{ userId: string }> = ({ userId }) => {
  const {
    conversation,
    isOpen,
    error,
    messagesEndRef,
    sendMessage,
    sendFeedback,
    toggleChatbot,
  } = useChatbot(userId);

  const [input, setInput] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="custom-chatbot">
      <button onClick={toggleChatbot}>
        {isOpen ? 'Close' : 'Open'} Chat
      </button>

      {isOpen && (
        <div className="chat-window">
          <div className="chat-messages">
            {conversation.messages.map((msg, i) => (
              <ChatMessage
                key={i}
                type={msg.type}
                content={msg.content}
                onFeedback={sendFeedback}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
};
```

## 🌐 8. Inline Chatbot (No Widget)

For embedded chat interfaces:

**File**: `components/InlineChatBot.tsx`

```typescript
'use client';

import { useChatbot } from '@/lib/hooks/useChatbot';
import { ChatMessage } from '@/components/ChatMessage';

export const InlineChatBot: React.FC<{ userId: string }> = ({ userId }) => {
  const { conversation, messagesEndRef, sendMessage } = useChatbot(userId);
  const [input, setInput] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">💬 Live Chat Support</h2>

      <div className="bg-gray-50 rounded p-4 min-h-96 max-h-96 overflow-y-auto mb-4">
        {conversation.messages.map((msg, i) => (
          <ChatMessage
            key={i}
            type={msg.type}
            content={msg.content}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};
```

## 📱 9. Mobile Responsive Chatbot

The default ChatBot component is already responsive, but here's custom styling:

**File**: `components/MobileChatBot.tsx`

```typescript
'use client';

import { ChatBot } from '@/components/ChatBot';

export const MobileChatBot: React.FC<{ userId: string }> = ({ userId }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {isMobile ? (
        <ChatBot
          userId={userId}
          position="bottom-right"
          theme="light"
          initialMessage="Xin chào! 👋 Tôi là trợ lý AI của bạn"
        />
      ) : (
        <ChatBot
          userId={userId}
          position="bottom-right"
          theme="dark"
          initialMessage="Chào bạn! Cần giúp đỡ gì không?"
        />
      )}
    </>
  );
};
```

## 🎨 10. Styled Chatbot with Tailwind

**File**: `components/StyledChatBot.tsx`

```typescript
'use client';

import { ChatBot } from '@/components/ChatBot';

export const StyledChatBot: React.FC<{ userId: string }> = ({ userId }) => {
  return (
    <style>{`
      .chatbot-custom {
        --primary-color: #3b82f6;
        --secondary-color: #1e293b;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
      }
    `}</style>
  );
};
```

---

## 🚀 Summary

| Page | Integration | Purpose |
|------|-----------|---------|
| All Pages | `RootLayoutContent` | Global chatbot |
| Product | Custom ChatBot | Product-specific help |
| Cart | ChatBot widget | Checkout assistance |
| Checkout | ChatBot widget | Payment support |
| Admin | `ChatBotStatsAdmin` | Manage stats |
| Custom | `useChatbot` hook | Full control |
| Inline | `InlineChatBot` | Embedded chat |
| Mobile | Responsive wrapper | Mobile-optimized |

Choose the integration that best fits your needs! 🎯
