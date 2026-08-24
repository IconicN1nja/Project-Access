"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  GitCommit,
  ChevronDown,
  RotateCw,
  Link as LinkIcon,
} from "lucide-react";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onCopy: (text: string) => void;
  onRegenerate?: (id: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming,
  onCopy,
  onRegenerate,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const isUser = message.role === "user";
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleCopyCode = (code: string, index: number) => {
    onCopy(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="relative group max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}

          <button
            title="Copy"
            onClick={() => onCopy(message.content)}
            className="absolute bottom-1 -left-8 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      {/* Bot Icon */}
      <img
        src="/icon.jpeg"
        alt="Project Access"
        className="w-7 h-7 rounded-lg object-cover shrink-0 mt-1 border border-zinc-200 dark:border-zinc-800"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-1">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Project Access
          </span>
          <span>•</span>
          <span>{timeStr}</span>
        </div>

        {/* Reasoning / Thinking Accordion */}
        {message.thinking && (
          <details className="mb-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs">
            <summary className="flex items-center justify-between px-3 py-1.5 cursor-pointer font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 select-none">
              <div className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" />
                <span>Reasoning</span>
              </div>
              <ChevronDown className="w-3 h-3 chevron-icon transition-transform" />
            </summary>
            <div className="p-2.5 pt-1 text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {message.thinking}
            </div>
          </details>
        )}

        {/* Markdown Content */}
        <div className="prose-chat text-zinc-800 dark:text-zinc-200 py-1">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                if (!inline && match) {
                  const codeIdx = Math.random();
                  return (
                    <div className="code-block-wrapper">
                      <div className="code-block-header">
                        <span>{match[1]}</span>
                        <button
                          onClick={() =>
                            handleCopyCode(codeString, codeIdx as any)
                          }
                          className="btn-copy-code flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
                          {copiedCodeIndex === (codeIdx as any) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre>
                        <code>{children}</code>
                      </pre>
                    </div>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}>
            {message.content}
          </ReactMarkdown>

          {isStreaming && <span className="cursor-blink" />}
        </div>

        {/* Source Citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div className="text-[11px] font-medium text-zinc-400 mb-1.5">
              Sources & Statutory Citations:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[11px] flex items-center gap-1.5">
                  <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {src.act_title || src.title}
                  </span>
                  {src.section_number && (
                    <span className="text-zinc-400">
                      ({src.section_number})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minimal Action Toolbar */}
        <div className="flex items-center gap-1 mt-2 text-zinc-400">
          <button
            title="Copy message"
            onClick={() => onCopy(message.content)}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onRegenerate && (
            <button
              title="Regenerate"
              onClick={() => onRegenerate(message.id)}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
