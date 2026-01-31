"use client";

import { useState, useEffect } from "react";
import FileUpload from "./components/FileUpload";
import ChatInterface from "./components/ChatInterface";
import ThemeToggle from "./components/ThemeToggle";
import { FileRecord, MessageRecord } from "@/lib/supabase";

export default function Home() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch files on mount and poll for updates
  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Check if chat should be enabled
  useEffect(() => {
    const hasReadyFile = files.some((file) => file.status === "ready");
    setIsChatEnabled(hasReadyFile);

    if (hasReadyFile && !currentFileId) {
      const readyFile = files.find((file) => file.status === "ready");
      if (readyFile) {
        setCurrentFileId(readyFile.file_id);
        fetchMessages(readyFile.file_id);
      }
    }
  }, [files, currentFileId]);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  };

  const fetchMessages = async (fileId: string) => {
    try {
      const response = await fetch(`/api/chat?file_id=${fileId}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleFileUploaded = (file: FileRecord) => {
    setFiles((prev) => [file, ...prev]);
  };

  const handleFileDeleted = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.file_id !== fileId));

    // If deleted file was the current chat file, reset chat
    if (currentFileId === fileId) {
      setCurrentFileId(null);
      setMessages([]);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!currentFileId) return;

    // Optimistic update - tambahkan user message langsung ke UI
    const tempUserMessage: MessageRecord = {
      id: `temp-${Date.now()}`,
      file_id: currentFileId,
      message: message,
      role: "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          file_id: currentFileId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Hapus message temporary jika error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== tempUserMessage.id),
        );
        throw new Error(data.error || "Failed to send message");
      }

      // Refresh messages dari server untuk mendapatkan response AI
      await fetchMessages(currentFileId);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  };

  const handleNewChat = async () => {
    setIsClearing(true);
    try {
      const response = await fetch("/api/clear", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clear data");
      }

      // Reset state
      setFiles([]);
      setMessages([]);
      setCurrentFileId(null);
      setIsChatEnabled(false);
      setShowClearDialog(false);
    } catch (error) {
      console.error("Failed to clear data:", error);
      alert("Gagal menghapus data. Silakan coba lagi.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  RAG Chatbot
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Document Intelligence Platform
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClearDialog(true)}
                disabled={files.length === 0 || isClearing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                title="Mulai chat baru (hapus semua data)"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Chat
              </button>
              <ThemeToggle />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Upload dokumen Anda dan chat dengan AI tentang konten dokumen
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 max-h-[calc(100vh-200px)] overflow-y-auto hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Upload Dokumen
                </h2>
              </div>
              <FileUpload
                onFileUploaded={handleFileUploaded}
                onFileDeleted={handleFileDeleted}
                files={files}
              />
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 h-[calc(100vh-200px)] flex flex-col hover:shadow-2xl transition-shadow duration-300">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-indigo-50/50 dark:from-gray-900/50 dark:to-indigo-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Chat dengan AI
                      </h2>
                      {isChatEnabled && currentFileId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {
                            files.find((f) => f.file_id === currentFileId)
                              ?.filename
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  {isChatEnabled && (
                    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="font-medium">Aktif</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatInterface
                  isEnabled={isChatEnabled}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clear All Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Konfirmasi Hapus Semua
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tindakan ini tidak bisa dibatalkan
                </p>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
                Anda akan menghapus <strong>{files.length} file</strong> dan{" "}
                <strong>semua riwayat chat</strong>. Data akan dihapus secara
                permanen dari sistem.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowClearDialog(false)}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleNewChat}
                disabled={isClearing}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Ya, Hapus Semua
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
