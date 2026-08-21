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

export default function Home() {
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

  // 1. Initial Load & Theme
  useEffect(() => {
    const loadedTheme = Storage.getTheme();
    const loadedChats = Storage.getChats();
    const loadedActiveId = Storage.getActiveChatId();

    setTheme(loadedTheme);
    setChats(loadedChats);

    if (loadedActiveId && loadedChats.some(c => c.id === loadedActiveId)) {
      setActiveChatId(loadedActiveId);
    } else if (loadedChats.length > 0) {
      setActiveChatId(loadedChats[0].id);
      Storage.setActiveChatId(loadedChats[0].id);
    }

    applyTheme(loadedTheme);

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
  const handleNewChat = () => {
    if (isGenerating) intelligence.abort();
    const newChat: Chat = {
      id: 'chat_' + Date.now(),
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      messages: []
    };

    const updated = [newChat, ...chats];
    setChats(updated);
    setActiveChatId(newChat.id);
    Storage.saveChats(updated);
    Storage.setActiveChatId(newChat.id);
    setInput('');
  };

  const handleSelectChat = (id: string) => {
    if (isGenerating) intelligence.abort();
    setActiveChatId(id);
    Storage.setActiveChatId(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    Storage.saveChats(updated);

    if (activeChatId === id) {
      const nextActiveId = updated.length > 0 ? updated[0].id : null;
      setActiveChatId(nextActiveId);
      Storage.setActiveChatId(nextActiveId);
    }
  };

  const handleRenameChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const chat = chats.find(c => c.id === id);
    if (!chat) return;

    const newTitle = prompt('Conversation title:', chat.title);
    if (newTitle && newTitle.trim()) {
      const updated = chats.map(c => c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c);
      setChats(updated);
      Storage.saveChats(updated);
    }
  };

  const handlePinChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = chats.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
    setChats(updated);
    Storage.saveChats(updated);
  };

  const handleClearChat = () => {
    if (!activeChatId) return;
    const updated = chats.map(c => c.id === activeChatId ? { ...c, messages: [], updatedAt: Date.now() } : c);
    setChats(updated);
    Storage.saveChats(updated);
    showToast('Messages cleared');
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
        title: textToSend.slice(0, 30) || 'New chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pinned: false,
        messages: []
      };
      currentChats = [currentChat, ...currentChats];
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
    Storage.saveChats(currentChats);

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
      onDone: () => {
        setIsGenerating(false);
        Storage.saveChats(currentChats);
      },
      onError: (err) => {
        setIsGenerating(false);
        botMessage.content += `\n\n> ⚠️ **Error**: ${err?.message || 'Failed to generate response'}`;
        Storage.saveChats(currentChats);
      }
    });
  };

  const handleStopGeneration = () => {
    intelligence.abort();
    setIsGenerating(false);
  };

  const handleRegenerate = (msgId: string) => {
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
    Storage.saveChats(chats);

    if (prevUserText) {
      handleSendMessage(prevUserText);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied');
  };

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
