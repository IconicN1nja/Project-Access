"use client";

import React from "react";
import { PanelLeft, Trash2 } from "lucide-react";

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
  onClear,
}) => {
  return (
    <header className="h-[var(--header-height)] px-4 border-b border-[var(--color-border-primary)] flex items-center justify-between bg-[var(--color-surface-primary)]/80 backdrop-blur-xl z-[var(--z-sticky)] transition-[background-color,border-color] duration-[var(--transition-base)]">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Only show expand button when sidebar is collapsed */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            title="Expand sidebar (⌘B)"
            className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-emerald-400 hover:bg-[var(--color-surface-hover)] transition-[background-color,color] duration-[var(--transition-fast)]">
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        {/* Display chat title without repeating brand name when sidebar is already open */}
        {(!isSidebarOpen ||
          (title &&
            title !== "Project Access" &&
            title !== "Welcome to Project Access")) && (
          <span className="font-medium text-sm text-[var(--color-text-primary)] truncate max-w-50 sm:max-w-md">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onClear}
          title="Clear conversation"
          className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-hover)] transition-[background-color,color] duration-[var(--transition-fast)]">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
