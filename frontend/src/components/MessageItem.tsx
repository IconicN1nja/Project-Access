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
        <div className="relative group max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-[var(--color-text-primary)] text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-sm">
          {message.content}

          <button
            title="Copy"
            onClick={() => onCopy(message.content)}
            className="absolute bottom-1 -left-8 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-text-quaternary)] hover:text-emerald-400 rounded bg-[var(--color-surface-primary)]/80 backdrop-blur-sm border border-[var(--color-border-primary)] shadow-[var(--shadow-sm)]">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      {/* Bot Icon */}
      <div className="w-7 h-7 rounded-lg shrink-0 mt-1 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm flex items-center justify-center">
        <img
          src="/icon.jpeg"
          alt="Project Access"
          className="w-5 h-5 rounded-md object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-text-quaternary)] mb-1">
          <span className="font-medium text-emerald-400">
            Project Access
          </span>
          <span>•</span>
          <span>{timeStr}</span>
        </div>

        {/* Reasoning / Thinking Accordion */}
        {message.thinking && (
          <details className="mb-2 rounded-md border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/60 backdrop-blur-sm text-xs">
            <summary className="flex items-center justify-between px-3 py-1.5 cursor-pointer font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] select-none">
              <div className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5" />
                <span>Reasoning</span>
              </div>
              <ChevronDown className="w-3 h-3 chevron-icon transition-transform" />
            </summary>
            <div className="p-2.5 pt-1 text-[var(--color-text-tertiary)] border-t border-[var(--color-border-primary)] font-mono text-[var(--text-xs)] leading-relaxed whitespace-pre-wrap">
              {message.thinking}
            </div>
          </details>
        )}

        {/* Markdown Content */}
        <div className="prose-chat text-[var(--color-text-secondary)] py-1">
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
                          className="btn-copy-code flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-[var(--color-text-quaternary)] hover:text-emerald-400 hover:bg-[var(--color-interactive-secondary-hover)] transition-colors">
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
          <div className="mt-3 pt-2 border-t border-[var(--color-border-primary)]/60">
            <div className="text-[var(--text-xs)] font-medium text-[var(--color-text-quaternary)] mb-1.5">
              Sources & Statutory Citations:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src, i) => (
                <div
                  key={i}
                  className="px-2 py-1 rounded border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm text-[var(--color-text-tertiary)] text-[var(--text-xs)] flex items-center gap-1.5 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all">
                  <LinkIcon className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                  <span className="font-medium text-emerald-400">
                    {src.act_title || src.title}
                  </span>
                  {src.section_number && (
                    <span className="text-[var(--color-text-quaternary)]">
                      ({src.section_number})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Minimal Action Toolbar */}
        <div className="flex items-center gap-1 mt-2 text-[var(--color-text-quaternary)]">
          <button
            title="Copy message"
            onClick={() => onCopy(message.content)}
            className="p-1 rounded hover:bg-[var(--color-surface-hover)] hover:text-emerald-400 text-xs transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onRegenerate && (
            <button
              title="Regenerate"
              onClick={() => onRegenerate(message.id)}
              className="p-1 rounded hover:bg-[var(--color-surface-hover)] hover:text-emerald-400 text-xs transition-colors">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
