"use client";

import { useState, useRef, useEffect } from "react";
import { MessageRecord } from "@/lib/supabase";

interface ChatInterfaceProps {
  isEnabled: boolean;
  messages: MessageRecord[];
  onSendMessage: (message: string) => Promise<void>;
}

export default function ChatInterface({
  isEnabled,
  messages,
  onSendMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !isEnabled) return;

    const message = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await onSendMessage(message);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    // 🔴 WAJIB min-h-0
    <div className="flex flex-col h-full min-h-0">
      {/* ================== MESSAGES AREA ================== */}
      {/* 🔴 flex-1 + min-h-0 = scroll aman */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {!isEnabled && messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Mulai Percakapan
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload dokumen terlebih dahulu untuk mulai chat
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Avatar AI */}
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                🤖
              </div>
            )}

            {/* Bubble */}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.message}</p>
              <p
                className={`text-xs mt-2 ${
                  msg.role === "user" ? "text-indigo-100" : "text-gray-400"
                }`}
              >
                {new Date(msg.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Avatar User */}
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center shrink-0">
                👤
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              🤖
            </div>
            <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl border">
              <div className="flex space-x-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-150">•</span>
                <span className="animate-bounce delay-300">•</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ================== INPUT AREA ================== */}
      {/* 🔴 Fixed height, tidak ikut scroll */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isEnabled || isSending}
            placeholder={
              isEnabled
                ? "Ketik pesan Anda..."
                : "Upload file terlebih dahulu..."
            }
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={!input.trim() || !isEnabled || isSending}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium
                       hover:bg-indigo-700 disabled:opacity-50"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
