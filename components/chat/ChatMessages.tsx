"use client";

import ChatBubble from "./ChatBubble";

interface ChatMessage {
  MESSAGE_ID?: number;
  ROOM_ID: string;
  SENDER_ID: number;
  RECEIVER_ID: number;
  MESSAGE: string;
  CREATED_AT?: string;
}

interface Props {
  messages?: ChatMessage[];
  userId: number;
}

export default function ChatMessages({
  messages = [],
  userId,
}: Props) {

  if (!messages.length) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Chưa có tin nhắn nào
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      {messages.map((msg, index) => (
        <ChatBubble
          key={msg.MESSAGE_ID ?? index}
          message={msg.MESSAGE}
          isMine={msg.SENDER_ID === userId}
          createdAt={msg.CREATED_AT}
        />
      ))}
    </div>
  );
}