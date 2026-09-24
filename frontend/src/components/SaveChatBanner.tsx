"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Check, X } from "lucide-react";

interface SaveChatBannerProps {
  isVisible: boolean;
  onSave: () => void;
  onDismiss: () => void;
}

export const SaveChatBanner: React.FC<SaveChatBannerProps> = ({
  isVisible,
  onSave,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mb-2.5 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#0D151B]/95 border border-emerald-500/30 backdrop-blur-2xl shadow-[0_10px_28px_rgba(0,0,0,0.6)] text-xs text-zinc-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
            <span className="truncate text-zinc-300 text-xs">
              Save this conversation to history?
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors text-[11px] font-medium cursor-pointer">
              Don&apos;t Save
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium text-[11px] transition-all shadow-md shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer">
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
