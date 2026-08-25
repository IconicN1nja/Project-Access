'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chat, Message } from '@/types';
import { Storage, PROMPT_TEMPLATES } from '@/lib/storage';
import { intelligence } from '@/lib/intelligence';
import { Sidebar } from '@/components/Sidebar';
import { ChatHeader } from '@/components/ChatHeader';
import { MessageItem } from '@/components/MessageItem';
import { ChatInput } from '@/components/ChatInput';
import { ClearModal } from '@/components/Modals';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sidebar & Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'error' } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadChatsForUser = async () => {
    try {
      const chatsRes = await fetch('/api/chats');
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        const dbChats = chatsData.chats || [];
        setChats(dbChats);

        const loadedActiveId = Storage.getActiveChatId();
        if (loadedActiveId && dbChats.some((c: any) => c.id === loadedActiveId)) {
          setActiveChatId(loadedActiveId);
        } else if (dbChats.length > 0) {
          setActiveChatId(dbChats[0].id);
          Storage.setActiveChatId(dbChats[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setChats([]);
        setActiveChatId(null);
        Storage.setActiveChatId(null);
        showToast('Logged out successfully');
      } else {
        showToast('Failed to log out', 'error');
      }
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Error logging out', 'error');
    }
  };

  // 1. Initial Load & Theme
  useEffect(() => {
    const loadedTheme = Storage.getTheme();
    setTheme(loadedTheme);
    applyTheme(loadedTheme);

    const checkAuthAndLoadChats = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);

            // Load chats from MongoDB
            const chatsRes = await fetch('/api/chats');
            if (chatsRes.ok) {
              const chatsData = await chatsRes.json();
              const dbChats = chatsData.chats || [];
              setChats(dbChats);

              const loadedActiveId = Storage.getActiveChatId();
              if (loadedActiveId && dbChats.some((c: any) => c.id === loadedActiveId)) {
                setActiveChatId(loadedActiveId);
              } else if (dbChats.length > 0) {
                setActiveChatId(dbChats[0].id);
                Storage.setActiveChatId(dbChats[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error verifying auth:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkAuthAndLoadChats();

    // Initial sidebar state based on screen width
    if (typeof window !== 'undefined') {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }

    // Keyboard shortcut for toggle sidebar (⌘B / Ctrl+B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [isAuthLoading, user, router]);

  // 2. Theme Applier
  const applyTheme = (t: string) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const isDark = t === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : t === 'dark';

    if (isDark) {
      root.classList.add('dark');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    Storage.saveTheme(nextTheme);
    applyTheme(nextTheme);
    showToast(`${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} mode enabled`);
  };

  const showToast = (message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

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
  const handleNewChat = async () => {
    if (isGenerating) intelligence.abort();
    const newChat: Chat = {
      id: 'chat_' + Date.now(),
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: []
    };

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChat),
      });
      if (res.ok) {
        const updated = [newChat, ...chats];
        setChats(updated);
        setActiveChatId(newChat.id);
        Storage.setActiveChatId(newChat.id);
        setInput('');
      } else {
        if (res.status === 401) {
          setUser(null);
          router.push('/login');
        } else {
          showToast('Failed to create new chat', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error creating new chat', 'error');
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
        method: 'DELETE',
      });
      if (res.ok) {
        const updated = chats.filter(c => c.id !== id);
        setChats(updated);
        if (activeChatId === id) {
          const nextActiveId = updated.length > 0 ? updated[0].id : null;
          setActiveChatId(nextActiveId);
          Storage.setActiveChatId(nextActiveId);
        }
        showToast('Chat deleted');
      } else {
        showToast('Failed to delete chat', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting chat', 'error');
    }
  };

  const handleRenameChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const newTitle = prompt('Conversation title:', chat.title);
    if (newTitle && newTitle.trim()) {
      try {
        const res = await fetch(`/api/chats/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle.trim() }),
        });
        if (res.ok) {
          const updated = chats.map(c => c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c);
          setChats(updated);
        } else {
          showToast('Failed to rename chat', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Error renaming chat', 'error');
      }
    }
  };

  const handlePinChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === id);
    if (!chat) return;
    const nextPinned = !chat.pinned;

    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: nextPinned }),
      });
      if (res.ok) {
        const updated = chats.map(c => c.id === id ? { ...c, pinned: nextPinned } : c);
        setChats(updated);
      } else {
        showToast('Failed to pin chat', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error pinning chat', 'error');
    }
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;
    try {
      const res = await fetch(`/api/chats/${activeChatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      if (res.ok) {
        const updated = chats.map(c => c.id === activeChatId ? { ...c, messages: [], updatedAt: Date.now() } : c);
        setChats(updated);
        showToast('Messages cleared');
      } else {
        showToast('Failed to clear chat', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error clearing chat', 'error');
    }
  };

  // 4. Send & Stream Message
  const handleSendMessage = async (overrideText?: string) => {
    if (isGenerating) return;
    const textToSend = overrideText !== undefined ? overrideText : input.trim();
    if (!textToSend) return;

    let currentChat = activeChat;
    let currentChats = [...chats];

    if (!currentChat) {
      currentChat = {
        id: 'chat_' + Date.now(),
        title: textToSend.length > 30 ? textToSend.substring(0, 30) + '...' : textToSend,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        messages: []
      };

      try {
        await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentChat),
        });
      } catch (err) {
        console.error('Failed to pre-save new chat:', err);
      }

      currentChats = [currentChat, ...currentChats];
      setChats(currentChats);
      setActiveChatId(currentChat.id);
      Storage.setActiveChatId(currentChat.id);
    }

    if (currentChat.messages.length === 0) {
      currentChat.title = textToSend.length > 30 ? textToSend.substring(0, 30) + '...' : textToSend;
    }

    const userMessage: Message = {
      id: 'msg_u_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const botMessage: Message = {
      id: 'msg_a_' + Date.now(),
      role: 'assistant',
      content: '',
      thinking: '',
      sources: [],
      timestamp: Date.now()
    };

    currentChat.messages = [...currentChat.messages, userMessage, botMessage];
    currentChat.updatedAt = Date.now();

    setChats(currentChats);

    setInput('');
    setIsGenerating(true);

    await intelligence.streamResponse({
      query: textToSend,
      messages: currentChat.messages.slice(0, -1),
      onThinking: (thinkingText) => {
        botMessage.thinking = thinkingText;
        setChats([...currentChats]);
      },
      onSources: (sourcesList) => {
        botMessage.sources = sourcesList;
        setChats([...currentChats]);
      },
      onChunk: (chunk) => {
        botMessage.content += chunk;
        setChats([...currentChats]);
      },
      onDone: async () => {
        setIsGenerating(false);
        try {
          await fetch(`/api/chats/${currentChat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: currentChat.title,
              messages: currentChat.messages
            }),
          });
        } catch (err) {
          console.error('Failed to save final messages:', err);
        }
      },
      onError: async (err) => {
        setIsGenerating(false);
        botMessage.content += `\n\n> ⚠️ **Error**: ${err?.message || 'Failed to generate response'}`;
        try {
          await fetch(`/api/chats/${currentChat.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: currentChat.messages }),
          });
        } catch (saveErr) {
          console.error('Failed to save error messages:', saveErr);
        }
      }
    });
  };

  const handleStopGeneration = () => {
    intelligence.abort();
    setIsGenerating(false);
  };

  const handleRegenerate = async (msgId: string) => {
    if (!activeChat || isGenerating) return;
    const msgIdx = activeChat.messages.findIndex(m => m.id === msgId);
    if (msgIdx === -1) return;

    let prevUserText = '';
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (activeChat.messages[i].role === 'user') {
        prevUserText = activeChat.messages[i].content;
        break;
      }
    }

    activeChat.messages.splice(msgIdx, 1);
    setChats([...chats]);

    try {
      await fetch(`/api/chats/${activeChat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: activeChat.messages }),
      });
    } catch (err) {
      console.error('Failed to sync regenerated chat:', err);
    }

    if (prevUserText) {
      handleSendMessage(prevUserText);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied');
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-3 border-zinc-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-3 border-zinc-900 border-t-transparent dark:border-white dark:border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Redirecting to login...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors">
      {/* 1. Sidebar with collapsible desktop/mobile toggle */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onPinChat={handlePinChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        user={user}
        onLogout={handleLogout}
      />

      {/* 2. Main Chat Viewport */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-zinc-950 relative transition-colors">
        <ChatHeader
          title={activeChat?.title || 'Project Access'}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onClear={() => setIsClearOpen(true)}
        />

        {/* Messages Scroll Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 select-text">
          <div className="w-full">
            {(!activeChat || activeChat.messages.length === 0) ? (
              /* Minimal Starter Screen */
              <div className="max-w-2xl mx-auto py-12 px-4 flex flex-col items-center justify-center text-center min-h-[50vh]">
                <img
                  src="/icon.jpeg"
                  alt="Project Access"
                  className="w-12 h-12 rounded-2xl object-cover mb-4 shadow-sm border border-zinc-200 dark:border-zinc-800"
                />
                <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Project Access
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm max-w-md mb-8">
                  Indian Criminal Law intelligence and statutory assistant for BNS, BNSS, POCSO, and Special Acts.
                </p>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {PROMPT_TEMPLATES.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => setInput(tpl.prompt)}
                      className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
                    >
                      <div className="text-[10px] font-medium text-zinc-400 uppercase mb-1">
                        {tpl.category}
                      </div>
                      <h4 className="font-medium text-zinc-800 dark:text-zinc-200 text-xs mb-0.5">
                        {tpl.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {tpl.prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {activeChat.messages.map((msg, index) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    isStreaming={isGenerating && index === activeChat.messages.length - 1}
                    onCopy={handleCopy}
                    onRegenerate={handleRegenerate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Bar */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          isGenerating={isGenerating}
          onStop={handleStopGeneration}
        />
      </main>

      {/* 3. Clear Modal */}
      <ClearModal
        isOpen={isClearOpen}
        onClose={() => setIsClearOpen(false)}
        onConfirm={handleClearChat}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 pointer-events-none">
          <div className="toast-enter flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md border border-zinc-700/40 dark:border-zinc-300/40">
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
