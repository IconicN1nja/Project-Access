"use client";

import React, { useState } from "react";
import { Chat } from "@/types";
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Edit2,
  Trash2,
  Sun,
  Moon,
  PanelLeftClose,
} from "lucide-react";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onPinChat: (id: string, e: React.MouseEvent) => void;
  onRenameChat: (id: string, e: React.MouseEvent) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  theme: string;
  onToggleTheme: () => void;
  user: { id: string; email: string; name: string } | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  isOpen,
  onToggle,
  onSelectChat,
  onNewChat,
  onPinChat,
  onRenameChat,
  onDeleteChat,
  theme,
  onToggleTheme,
  user,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  });

  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const yesterday = today - 86400000;
  const pastWeek = today - 86400000 * 7;

  const groups = {
    pinned: filteredChats.filter((c) => c.pinned),
    today: filteredChats.filter((c) => {
      const t = new Date(c.updatedAt || c.createdAt || Date.now()).getTime();
      return !c.pinned && t >= today;
    }),
    yesterday: filteredChats.filter((c) => {
      const t = new Date(c.updatedAt || c.createdAt || Date.now()).getTime();
      return !c.pinned && t >= yesterday && t < today;
    }),
    pastWeek: filteredChats.filter((c) => {
      const t = new Date(c.updatedAt || c.createdAt || Date.now()).getTime();
      return !c.pinned && t >= pastWeek && t < yesterday;
    }),
    older: filteredChats.filter((c) => {
      const t = new Date(c.updatedAt || c.createdAt || Date.now()).getTime();
      return !c.pinned && t < pastWeek;
    }),
  };

  const renderGroup = (title: string, items: Chat[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="mb-3">
        <div className="px-2 mb-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
          {title}
        </div>
        <div className="space-y-0.5">
          {items.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${isActive
                    ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}>
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{chat.title || "New chat"}</span>
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Pin"
                    onClick={(e) => onPinChat(chat.id, e)}
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                    <Pin
                      className={`w-3 h-3 ${chat.pinned ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    title="Rename"
                    onClick={(e) => onRenameChat(chat.id, e)}
                    className="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    title="Delete"
                    onClick={(e) => onDeleteChat(chat.id, e)}
                    className="p-0.5 rounded text-zinc-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container with smooth width & translate transition */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-all duration-200 ease-in-out ${isOpen
            ? "w-56 sm:w-60 translate-x-0 opacity-100"
            : "w-0 -translate-x-full lg:w-0 lg:translate-x-0 opacity-0 pointer-events-none border-none"
          }`}>
        <div className="w-56 sm:w-60 overflow-hidden flex flex-col flex-1">
          {/* Header */}
          <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <button
              onClick={onNewChat}
              title="Return to homepage"
              className="flex items-center gap-2.5 text-left group"
            >
              <img
                src="/icon.jpeg"
                alt="Project Access Logo"
                className="w-7 h-7 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 group-hover:scale-105 transition-transform"
              />
              <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">
                Project Access
              </span>
            </button>

            <button
              onClick={onToggle}
              title="Collapse sidebar"
              className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors">
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat & Search */}
          <div className="p-3 space-y-2 shrink-0">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 text-zinc-900 dark:text-zinc-100 font-medium text-xs shadow-sm transition-colors">
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                <span>New chat</span>
              </div>
              <kbd className="text-[10px] text-zinc-400 font-mono">⌘K</kbd>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500"
              />
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
            {filteredChats.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-400">
                No conversations
              </div>
            ) : (
              <>
                {renderGroup("Pinned", groups.pinned)}
                {renderGroup("Today", groups.today)}
                {renderGroup("Yesterday", groups.yesterday)}
                {renderGroup("Previous 7 Days", groups.pastWeek)}
                {renderGroup("Older", groups.older)}
              </>
            )}
          </div>

          {/* User Profile & Logout */}
          {user && (
            <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1.5 shrink-0 bg-zinc-100/30 dark:bg-zinc-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center shrink-0 uppercase">
                    {(user.name || user.email).charAt(0)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-semibold truncate text-zinc-800 dark:text-zinc-200">
                      {user.name || 'User'}
                    </span>
                    <span className="text-[9px] truncate text-zinc-500 dark:text-zinc-400">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Log Out"
                  className="p-1 rounded-md text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-log-out"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" x2="9" y1="12" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Minimal Footer with Dark/Light mode switch */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-zinc-500 font-medium">
              Project Access AI
            </span>
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-xs">
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-zinc-400">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-[11px] text-zinc-500">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
