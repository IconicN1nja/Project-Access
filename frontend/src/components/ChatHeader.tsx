"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface ChatHeaderProps {
  title?: string;
  onClear: () => void;
  onOpenButtonSystemSheet?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClear }) => {
  return (
    <div className="fixed top-5 right-5 sm:right-7 z-40 pointer-events-auto">
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
