'use client';

import React from 'react';
import { PanelLeft, Trash2 } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onClear: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  isSidebarOpen,
  onToggleSidebar,
  onClear
}) => {
  return (
    <header className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur z-20 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Only show expand button when sidebar is collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            title="Expand sidebar (⌘B)"
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Display chat title without repeating brand name when sidebar is already open */}
        {(!isSidebarOpen || (title && title !== 'Project Access' && title !== 'Welcome to Project Access')) && (
          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onClear}
          title="Clear conversation"
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
