"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Copy,
  Check,
  GitCommit,
  ChevronDown,
  RotateCw,
  Volume2,
  VolumeX,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onCopy: (text: string) => void;
  onRegenerate?: (id: string) => void;
}

// Separate top direct answer section from the main body
function splitDirectAnswer(content: string) {
  if (!content) return { directAnswer: null, body: "" };

  const trimmed = content.trim();

  // 1. Explicit heading match (e.g. ### Direct Legal Summary, ### Direct Answer, **Direct Answer:**)
  const explicitMatch = trimmed.match(
    /^(?:#{1,4}\s*(?:⚡\s*|⚖️\s*)?(?:Direct Legal Summary|Direct Answer|Executive Summary|Key Summary|Summary)[:\s]*|\*\*(?:Direct Legal Summary|Direct Answer|Executive Summary|Key Summary|Summary):\*\*\s*)/i,
  );

  if (explicitMatch) {
    const afterHeader = trimmed.slice(explicitMatch[0].length);
    const nextSectionIdx = afterHeader.search(
      /\n\s*(?:#{1,6}\s+|---|___|\*\*\*|\|)/,
    );
    if (nextSectionIdx !== -1) {
      return {
        directAnswer: afterHeader.slice(0, nextSectionIdx).trim(),
        body: afterHeader.slice(nextSectionIdx).trim(),
      };
    } else {
      return {
        directAnswer: afterHeader.trim(),
        body: "",
      };
    }
  }

  // 2. Implicit opening block: Text before the first markdown heading (e.g. ### Statutes to Refer or ## Applying the law)
  const firstHeadingIdx = trimmed.search(
    /\n\s*(?:#{1,6}\s+|---|___|\*\*\*|\|)/,
  );
  if (firstHeadingIdx !== -1) {
    const topBlock = trimmed.slice(0, firstHeadingIdx).trim();
    const rest = trimmed.slice(firstHeadingIdx).trim();
    if (
      topBlock &&
      topBlock.length > 10 &&
      topBlock.length < 1200 &&
      !topBlock.startsWith("#") &&
      !topBlock.startsWith("|")
    ) {
      return {
        directAnswer: topBlock,
        body: rest,
      };
    }
  }

  // 3. Short single-paragraph message without headings
  if (
    trimmed.length > 0 &&
    trimmed.length <= 400 &&
    !trimmed.includes("\n\n") &&
    !trimmed.startsWith("#") &&
    !trimmed.startsWith("|")
  ) {
    return {
      directAnswer: trimmed,
      body: "",
    };
  }

  return { directAnswer: null, body: content };
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isStreaming,
  onCopy,
  onRegenerate,
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const plainText = message.content
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*+/g, "")
      .replace(/`{1,3}[\s\S]*?`{1,3}/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "en-IN";
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Clean raw <br> tags: convert <br> to real HTML breaks or clean spacing
  const formatContent = (text: string) => {
    if (!text) return "";
    return text.replace(/<br\s*\/?>/gi, "<br/>");
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

  // Small compact error view if message is an error
  const isError =
    message.isError ||
    message.content.includes("Something went wrong") ||
    message.content.startsWith("Error generating answer") ||
    message.content.includes("All configured Groq API keys");

  if (isError) {
    return (
      <div className="flex items-start gap-3 group">
        <div className="hidden sm:flex w-7 h-7 rounded-lg shrink-0 mt-1 border border-red-500/30 bg-red-500/10 backdrop-blur-sm items-center justify-center">
          <AlertCircle className="w-4 h-4 text-red-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-text-quaternary)] mb-1.5">
            <span className="font-medium text-red-400">Project Access</span>
            <span>•</span>
            <span>{timeStr}</span>
          </div>

          <div className="inline-flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
            <span>Something went wrong. Please try again.</span>
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(message.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white font-medium text-xs transition-colors border border-red-500/30 cursor-pointer">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { directAnswer, body } = splitDirectAnswer(message.content);

  const markdownComponents = {
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
                onClick={() => handleCopyCode(codeString, codeIdx as any)}
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
  };

  return (
    <div className="flex items-start gap-3 group">
      {/* Bot Icon */}
      <div className="hidden sm:flex w-7 h-7 rounded-lg shrink-0 mt-1 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm items-center justify-center">
        <img
          src="/icon.jpeg"
          alt="Project Access"
          className="w-5 h-5 rounded-md object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-text-quaternary)] mb-1">
          <span className="font-medium text-emerald-400">Project Access</span>
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

        {/* Top Direct Answer Section Highlighted Box (White Border, Dark Background) */}
        {directAnswer && (
          <div className="relative overflow-hidden my-3 p-4 sm:p-5 rounded-2xl bg-[#0D151B]/95 border border-white/80 shadow-[0_0_20px_rgba(255,255,255,0.08)] backdrop-blur-xl text-zinc-100">
            {/* <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/15">
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                Direct Legal Answer
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/10 border border-white/20 text-zinc-200">
                Key Summary
              </span>
            </div> */}

            <div className="prose-chat text-zinc-100 text-sm leading-relaxed font-medium">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={markdownComponents}>
                {formatContent(directAnswer)}
              </ReactMarkdown>
              {isStreaming && !body && <span className="cursor-blink" />}
            </div>
          </div>
        )}

        {/* Remaining Markdown Body */}
        {body && (
          <div className="prose-chat text-[var(--color-text-secondary)] py-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}>
              {formatContent(body)}
            </ReactMarkdown>
            {isStreaming && <span className="cursor-blink" />}
          </div>
        )}



        {/* Minimal Action Toolbar */}
        <div className="flex items-center gap-1 mt-2 text-[var(--color-text-quaternary)]">
          <button
            title={isSpeaking ? "Stop reading aloud" : "Read aloud (Voice)"}
            onClick={toggleSpeech}
            className={`p-1 rounded text-xs transition-colors flex items-center gap-1 ${isSpeaking
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "hover:bg-[var(--color-surface-hover)] hover:text-emerald-400"
              }`}>
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">
                  Speaking...
                </span>
              </>
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
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
