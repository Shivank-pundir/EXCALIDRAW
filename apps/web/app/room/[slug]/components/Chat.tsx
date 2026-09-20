"use client";

import { useEffect, useRef } from "react";

export type ChatMessage = {
  id?: number;
  chatId?: number;
  message: string;
  userId: string;
  username: string;
};

type ChatProps = {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  isChatConnected: boolean;
  currentUserId: string;
  onSendMessage: () => void;
};

function initialsFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function Chat({
  chatMessages,
  chatInput,
  setChatInput,
  isChatConnected,
  currentUserId,
  onSendMessage,
}: ChatProps) {
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  return (
    <aside
      className="hidden w-80 shrink-0 flex-col lg:flex"
      style={{ backgroundColor: "#12172A" }}
    >
      {/* Header */}
      <div
        className="flex h-16 shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div>
          <p
            className="text-2xl leading-none"
            style={{ color: "#F8F0DC", fontFamily: "var(--font-caveat)" }}
          >
            Room Chat
          </p>

          <p className="mt-0.5 text-xs text-zinc-500">
            {chatMessages.length}{" "}
            {chatMessages.length === 1 ? "message" : "messages"}
          </p>
        </div>

        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: isChatConnected
              ? "rgba(74,222,128,0.12)"
              : "rgba(248,113,113,0.12)",
            color: isChatConnected ? "#4ade80" : "#f87171",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: isChatConnected ? "#4ade80" : "#f87171",
            }}
          />
          {isChatConnected ? "Online" : "Offline"}
        </span>
      </div>

      {/* Messages */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(232,163,61,0.06) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {chatMessages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: "rgba(232,163,61,0.15)" }}
            >
              💬
            </div>

            <p className="mt-4 text-sm font-medium text-zinc-300">
              No messages yet
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Say something to get the conversation going.
            </p>
          </div>
        ) : (
          chatMessages.map((chat, index) => {
            const isOwnMessage = chat.userId === currentUserId;
            const previousChat = chatMessages[index - 1];
            const isGrouped =
              previousChat?.userId === chat.userId;

            return (
              <div
                key={`${chat.chatId ?? chat.id ?? "message"}-${index}`}
                className={`flex items-end gap-2 ${
                  isOwnMessage ? "flex-row-reverse" : ""
                } ${isGrouped ? "mt-1" : "mt-3"}`}
              >
                {!isOwnMessage && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: isGrouped
                        ? "transparent"
                        : "#E8A33D",
                      color: "#1B2138",
                    }}
                  >
                    {!isGrouped && initialsFor(chat.username)}
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                    isOwnMessage ? "rounded-br-md" : "rounded-bl-md"
                  }`}
                  style={{
                    backgroundColor: isOwnMessage
                      ? "rgba(232,163,61,0.16)"
                      : "#1A2035",
                    border: isOwnMessage
                      ? "1px solid rgba(232,163,61,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {!isOwnMessage && !isGrouped && (
                    <p
                      className="mb-1 text-xs font-semibold"
                      style={{ color: "#E8A33D" }}
                    >
                      {chat.username}
                    </p>
                  )}

                  <p className="break-words text-sm leading-5 text-zinc-100">
                    {chat.message}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t p-3"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSendMessage();
              }
            }}
            placeholder="Write a message..."
            className="min-w-0 flex-1 rounded-full border-0 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-500 focus:ring-2"
            style={{
              backgroundColor: "#1A2035",
              color: "#F8F0DC",
            }}
          />

          <button
            onClick={onSendMessage}
            disabled={!isChatConnected || !chatInput.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30"
            style={{ backgroundColor: "#E8A33D" }}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1B2138"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 translate-x-[1px]"
            >
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
