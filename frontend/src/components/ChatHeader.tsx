"use client";

import React from "react";
import { Trash2, Plus, Bookmark } from "lucide-react";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  title?: string;
  onClear: () => void;
  onNewChat?: () => void;
  onOpenButtonSystemSheet?: () => void;
  isSaveEnabled?: boolean;
  onToggleSave?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClear,
  onNewChat,
  isSaveEnabled = false,
  onToggleSave,
}) => {
  return (
    <div className="fixed top-5 right-5 sm:right-7 z-40 pointer-events-auto flex items-center gap-2">
      {onToggleSave && (
        <motion.button
          onClick={onToggleSave}
          title={
            isSaveEnabled
              ? "Save Chat History: ENABLED"
              : "Save Chat History: DISABLED"
          }
          aria-label="Toggle Save Chat History"
          whileHover={{ scale: 1.04, y: -1.5 }}
          whileTap={{ scale: 0.96 }}
          className={`h-[38px] px-3 sm:px-3.5 rounded-full border backdrop-blur-xl text-xs font-medium flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-200 cursor-pointer ${isSaveEnabled
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              : "bg-[#0c1218]/85 border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
            }`}
        >
          <Bookmark
            className={`w-3.5 h-3.5 ${isSaveEnabled ? "text-emerald-400 fill-emerald-400/30" : "text-zinc-400"
              }`}
          />
          <span className="hidden sm:inline font-medium text-[11.5px] tracking-wide flex items-center gap-1">
            <span>Save Chat</span>
            <span
              className={`px-1.5 py-0.2 text-[9.5px] font-bold rounded-full ${isSaveEnabled
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/10 text-zinc-400"
                }`}
            >
              {isSaveEnabled ? "ON" : "OFF"}
            </span>
          </span>
        </motion.button>
      )}

      {onNewChat && (
        <motion.button
          onClick={onNewChat}
          title="New Chat"
          aria-label="New Chat"
          whileHover={{ scale: 1.04, y: -1.5 }}
          whileTap={{ scale: 0.96 }}
          className="h-[38px] px-3 sm:px-3.5 rounded-full border border-emerald-500/30 hover:border-emerald-400/60 bg-[#0c1218]/90 hover:bg-emerald-950/40 backdrop-blur-xl text-emerald-300 hover:text-emerald-200 text-xs font-medium flex items-center gap-1.5 shadow-[0_4px_20px_rgba(16,185,129,0.15)] transition-all duration-200 group"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium text-[11.5px] tracking-wide">
            New Chat
          </span>
        </motion.button>
      )}

      <motion.button
        onClick={onClear}
        title="Delete conversation"
        aria-label="Delete conversation"
        whileHover={{ scale: 1.04, y: -1.5 }}
        whileTap={{ scale: 0.96 }}
        className="h-[38px] px-3 sm:px-3.5 rounded-full border border-white/10 hover:border-rose-500/40 bg-[#0c1218]/85 hover:bg-rose-950/30 backdrop-blur-xl text-zinc-400 hover:text-rose-300 text-xs font-medium flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-200 group">
        <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-rose-400 transition-colors" />
        <span className="hidden sm:inline font-medium text-[11.5px] tracking-wide">
          Delete
        </span>
      </motion.button>
    </div>
  );
};
