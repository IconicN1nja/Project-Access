"use client";

import React, { useState, useEffect, useRef } from "react";
import { Chat, Message } from "@/types";
import { Storage } from "@/lib/storage";
import { intelligence } from "@/lib/intelligence";
import { Sidebar } from "@/components/Sidebar";
import { ChatHeader } from "@/components/ChatHeader";
import { MessageItem } from "@/components/MessageItem";
import { ChatInput } from "@/components/ChatInput";
import { HeroHomepage } from "@/components/HeroHomepage";
import { ClearModal } from "@/components/Modals";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sidebar & Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  );
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type?: "info" | "error";
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setChats([]);
        setActiveChatId(null);
        Storage.setActiveChatId(null);
        showToast("Logged out successfully");
      } else {
        showToast("Failed to log out", "error");
      }
    } catch {
      showToast("Error logging out", "error");
    }
  };

  // 1. Initial Load
  useEffect(() => {
    const checkAuthAndLoadChats = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);

            // Load chats from MongoDB
            const chatsRes = await fetch("/api/chats");
            if (chatsRes.ok) {
              const chatsData = await chatsRes.json();
              const dbChats = chatsData.chats || [];
              setChats(dbChats);

              const loadedActiveId = Storage.getActiveChatId();
              if (
                loadedActiveId &&
                dbChats.some((c: { id: string }) => c.id === loadedActiveId)
              ) {
                setActiveChatId(loadedActiveId);
              } else {
                // Default to showing the homepage
                setActiveChatId(null);
                Storage.setActiveChatId(null);
              }
            }
          }
        }
      } catch {
        // Auth check failed - user will be redirected to login
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthAndLoadChats();

    // Keyboard shortcut for toggle sidebar (⌘B / Ctrl+B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login");
    }
  }, [isAuthLoading, user, router]);

  const showToast = (message: string, type: "info" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Auto-scroll
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isGenerating]);

  // 3. Conversation Management
  const handleNewChat = () => {
    if (isGenerating) intelligence.abort();
    setActiveChatId(null);
    Storage.setActiveChatId(null);
    setInput("");
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectChat = (id: string) => {
    if (isGenerating) intelligence.abort();
    setActiveChatId(id);
    Storage.setActiveChatId(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updated = chats.filter((c) => c.id !== id);
        setChats(updated);
        if (activeChatId === id) {
          const nextActiveId = updated.length > 0 ? updated[0].id : null;
          setActiveChatId(nextActiveId);
          Storage.setActiveChatId(nextActiveId);
        }
        showToast("Chat deleted");
      } else {
        showToast("Failed to delete chat", "error");
      }
    } catch {
      showToast("Error deleting chat", "error");
    }
  };

  const handleRenameChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;

    const newTitle = prompt("Conversation title:", chat.title);
    if (newTitle && newTitle.trim()) {
      try {
        const res = await fetch(`/api/chats/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim() }),
        });
        if (res.ok) {
          const updated = chats.map((c) =>
            c.id === id
              ? { ...c, title: newTitle.trim(), updatedAt: Date.now() }
              : c,
          );
          setChats(updated);
        } else {
          showToast("Failed to rename chat", "error");
        }
      } catch {
        showToast("Error renaming chat", "error");
      }
    }
  };

  const handlePinChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    const nextPinned = !chat.pinned;

    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      });
      if (res.ok) {
        const updated = chats.map((c) =>
          c.id === id ? { ...c, pinned: nextPinned } : c,
        );
        setChats(updated);
      } else {
        showToast("Failed to pin chat", "error");
      }
    } catch {
      showToast("Error pinning chat", "error");
    }
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      if (res.ok) {
        const updated = chats.map((c) =>
          c.id === activeChatId
            ? { ...c, messages: [], updatedAt: Date.now() }
            : c,
        );
        setChats(updated);
        showToast("Messages cleared");
      } else {
        showToast("Failed to clear chat", "error");
      }
    } catch {
      showToast("Error clearing chat", "error");
    }
  };

  // 4. Send & Stream Message
  const handleSendMessage = async (overrideText?: string) => {
    if (isGenerating) return;
    const textToSend = overrideText !== undefined ? overrideText : input.trim();
    if (!textToSend) return;

    const titleFromText =
      textToSend.length > 30 ? textToSend.substring(0, 30) + "..." : textToSend;

    // Create or reuse the chat being responded to
    const existingChat = activeChat;
    // eslint-disable-next-line react-hooks/purity
    const chatId = existingChat?.id ?? "chat_" + Date.now();
    const isNewChat = !existingChat;

    const currentChat: Chat = existingChat ?? {
      id: chatId,
      title: titleFromText,
      // eslint-disable-next-line react-hooks/purity
      createdAt: Date.now(),
      // eslint-disable-next-line react-hooks/purity
      updatedAt: Date.now(),
      pinned: false,
      messages: [],
    };

    const userMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: "msg_u_" + Date.now(),
      role: "user",
      content: textToSend,
      // eslint-disable-next-line react-hooks/purity
      timestamp: Date.now(),
    };

    const botMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: "msg_a_" + Date.now(),
      role: "assistant",
      content: "",
      thinking: "",
      sources: [],
      // eslint-disable-next-line react-hooks/purity
      timestamp: Date.now(),
    };

    // Build the working messages list immutably
    const workingMessages = [...currentChat.messages, userMessage, botMessage];
    const workingTitle =
      currentChat.messages.length === 0 ? titleFromText : currentChat.title;

    if (isNewChat) {
      try {
        await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: chatId,
            title: workingTitle,
            messages: workingMessages,
          }),
        });
      } catch {
        // Chat will be saved on message completion
      }
    }

    setChats((prevChats) => {
      const updatedChat: Chat = {
        ...currentChat,
        title: workingTitle,
        updatedAt: Date.now(),
        messages: workingMessages,
      };
      return isNewChat
        ? [updatedChat, ...prevChats]
        : prevChats.map((c) => (c.id === chatId ? updatedChat : c));
    });
    setActiveChatId(chatId);
    Storage.setActiveChatId(chatId);

    setInput("");
    setIsGenerating(true);

    await intelligence.streamResponse({
      query: textToSend,
      messages: workingMessages.slice(0, -1),
      onThinking: (thinkingText) => {
        botMessage.thinking = thinkingText;
        setChats((_prev) =>
          _prev.map((c) =>
            c.id === chatId ? { ...c, messages: [...workingMessages] } : c,
          ),
        );
      },
      onSources: (sourcesList) => {
        botMessage.sources = sourcesList;
        setChats((_prev) =>
          _prev.map((c) =>
            c.id === chatId ? { ...c, messages: [...workingMessages] } : c,
          ),
        );
      },
      onChunk: (chunk) => {
        botMessage.content += chunk;
        setChats((_prev) =>
          _prev.map((c) =>
            c.id === chatId ? { ...c, messages: [...workingMessages] } : c,
          ),
        );
      },
      onDone: async () => {
        setIsGenerating(false);
        try {
          await fetch(`/api/chats/${chatId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: workingTitle,
              messages: [...workingMessages],
            }),
          });
        } catch {
          // Error saving final messages - will retry on next interaction
        }
      },
      onError: async (err) => {
        setIsGenerating(false);
        botMessage.content += `\n\n> ⚠️ **Error**: ${err?.message || "Failed to generate response"}`;
        try {
          await fetch(`/api/chats/${chatId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [...workingMessages] }),
          });
        } catch {
          // Error persisting messages - state is preserved in memory
        }
      },
    });
  };

  const handleStopGeneration = () => {
    intelligence.abort();
    setIsGenerating(false);
  };

  const handleRegenerate = async (msgId: string) => {
    if (!activeChat || isGenerating) return;
    const msgIdx = activeChat.messages.findIndex((m) => m.id === msgId);
    if (msgIdx === -1) return;

    let prevUserText = "";
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === "user") {
        prevUserText = activeChat.messages[i].content;
        break;
      }
    }

    const updatedMessages = activeChat.messages.filter((m) => m.id !== msgId);
    const updatedChats = chats.map((c) =>
      c.id === activeChat.id ? { ...c, messages: updatedMessages } : c,
    );
    setChats(updatedChats);

    try {
      await fetch(`/api/chats/${activeChat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });
    } catch {
      // Error syncing - will retry on next interaction
    }

    if (prevUserText) {
      handleSendMessage(prevUserText);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied");
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors">
        <LoadingSpinner message="Verifying session..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors">
        <LoadingSpinner message="Redirecting to login..." />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors">
      {/* 1. Sidebar with collapsible desktop/mobile toggle */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onPinChat={handlePinChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Chat Viewport */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[var(--color-bg-primary)] chat-bg-mesh relative transition-colors">
        {!activeChat || activeChat.messages.length === 0 ? (
          /* Figma-inspired AI Chatbot Homepage Hero View */
          <div className="flex-1 flex flex-col h-full overflow-y-auto">
            <HeroHomepage
              onSendMessage={(q) => handleSendMessage(q)}
              isGenerating={isGenerating}
              onStop={handleStopGeneration}
              isSidebarOpen={isSidebarOpen}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          </div>
        ) : (
          <>
            <ChatHeader
              title={activeChat?.title || "Project Access"}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              onClear={() => setIsClearOpen(true)}
            />

            {/* Messages Scroll Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 select-text relative z-10">
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {activeChat.messages.map((msg, index) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    isStreaming={
                      isGenerating && index === activeChat.messages.length - 1
                    }
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                  />
                ))}
              </div>
            </div>

            {/* Input Bar for Active Chat */}
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={() => handleSendMessage()}
              isGenerating={isGenerating}
              onStop={handleStopGeneration}
            />
          </>
        )}
      </main>

      {/* 3. Clear Modal */}
      <ClearModal
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={handleClearChat}
      />

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
