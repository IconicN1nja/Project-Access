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
    <div className="p-3 sm:p-4 bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors shadow-sm flex items-end gap-2">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question or search statutes..."
            className="flex-1 bg-transparent border-0 resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none max-h-44 px-1 py-1 leading-relaxed"
          />

          {/* Send / Stop Button */}
          <button
            onClick={isGenerating ? onStop : onSend}
            disabled={!isGenerating && !input.trim()}
            title={isGenerating ? 'Stop generation' : 'Send (Enter)'}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0 ${isGenerating
              ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
              : input.trim()
                ? 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
              }`}
          >
            {isGenerating ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>

        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
          Project Access provides statutory information. Always consult a legal
          professional for case filings.
        </p>
      </div>
    </div>
  );
};
