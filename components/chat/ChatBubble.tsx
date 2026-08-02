"use client";

interface Props {
  message: string;
  isMine: boolean;
  createdAt?: string;
}

export default function ChatBubble({
  message,
  isMine,
  createdAt,
}: Props) {
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className={`flex ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[75%]
          rounded-2xl
          px-4
          py-3
          shadow-md
          break-words
          ${
            isMine
              ? "bg-blue-600 text-white rounded-br-md"
              : "bg-white border border-gray-200 text-gray-800 rounded-bl-md"
          }
        `}
      >
        <p>{message}</p>

        {time && (
          <p
            className={`mt-1 text-[11px] ${
              isMine
                ? "text-blue-100"
                : "text-gray-400"
            }`}
          >
            {time}
          </p>
        )}
      </div>
    </div>
  );
}