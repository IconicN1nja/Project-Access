"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isGenerating: boolean;
  onStop: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isGenerating,
  onStop,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating) {
        onStop();
      } else {
        onSend();
      }
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-transparent relative z-10">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/80 backdrop-blur-xl p-2.5 focus-within:border-emerald-500/50 focus-within:shadow-[0_0_0_3px_rgba(52,211,153,0.1)] transition-all duration-[var(--transition-base)] shadow-[var(--shadow-md)] flex items-end gap-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question or search statutes..."
            className="flex-1 bg-transparent border-0 resize-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none max-h-44 px-1 py-1 leading-relaxed"
          />

          {/* Send / Stop Button */}
          <button
            onClick={isGenerating ? onStop : onSend}
            disabled={!isGenerating && !input.trim()}
            title={isGenerating ? "Stop generation" : "Send (Enter)"}
            className={`p-2 rounded-lg transition-all duration-[var(--transition-base)] flex items-center justify-center flex-shrink-0 ${
              isGenerating
                ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                : input.trim()
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                  : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-quaternary)] cursor-not-allowed opacity-50"
            }`}>
            {isGenerating ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-center text-[var(--text-xs)] text-[var(--color-text-quaternary)] mt-2">
          Project Access provides statutory information. Always consult a legal
          professional for case filings.
        </p>
      </div>
    </div>
  );
};
