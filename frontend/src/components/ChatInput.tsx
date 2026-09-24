"use client";

import React, { useRef, useEffect, useState } from "react";
import { ArrowUp, Square, Paperclip, Mic } from "lucide-react";
import { motion } from "framer-motion";

import { SaveChatBanner } from "./SaveChatBanner";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (textOverride?: string, isVoice?: boolean) => void;
  isGenerating: boolean;
  onStop: () => void;
  showSaveBanner?: boolean;
  onSaveChat?: () => void;
  onDismissSave?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isGenerating,
  onStop,
  showSaveBanner = false,
  onSaveChat,
  onDismissSave,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isBursting, setIsBursting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      if (typeof window !== "undefined" && window.navigator && window.navigator.language) {
        recognition.lang = window.navigator.language;
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInput(currentTranscript);

        // Auto-send if finalized speech
        if (event.results[0] && event.results[0].isFinal) {
          setIsListening(false);
          if (currentTranscript.trim()) {
            onSend(currentTranscript.trim(), true);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTriggerSend();
    }
  };

  const handleTriggerSend = (overrideVoice?: boolean) => {
    if (isGenerating) {
      onStop();
      return;
    }
    if (!input.trim()) return;

    setIsBursting(true);
    setTimeout(() => {
      setIsBursting(false);
      onSend(input.trim(), overrideVoice ?? isListening);
    }, 200);
  };

  const hasText = Boolean(input.trim());

  return (
    <div className="p-3 sm:p-4 bg-transparent relative z-10">
      <div className="max-w-3xl mx-auto">
        
        {/* Save Chat Prompt Banner */}
        <SaveChatBanner
          isVisible={showSaveBanner}
          onSave={onSaveChat || (() => {})}
          onDismiss={onDismissSave || (() => {})}
        />

        {/* Listening Banner */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium backdrop-blur-md shadow-lg w-fit mx-auto"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Listening... speak your legal query now</span>
          </motion.div>
        )}

        <div
          className={`rounded-2xl border bg-[#0E0E12]/85 backdrop-blur-2xl p-3 transition-all duration-200 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.6)] flex items-end gap-2 ${
            isListening
              ? "border-rose-500/50 ring-2 ring-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.3)]"
              : "border-white/10 focus-within:border-[#7C3AED]/50 focus-within:ring-1 focus-within:ring-[#7C3AED]/30 focus-within:shadow-[0_12px_40px_-10px_rgba(124,58,237,0.25)]"
          }`}
        >
          
          {/* Attach Button */}
          <button
            type="button"
            title="Attach legal document or FIR copy"
            onClick={() => alert("Upload document for legal section mapping.")}
            className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-zinc-400 hover:text-white shrink-0 mb-0.5"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening to your voice..." : "Describe additional details or cite sections (e.g. arrest procedure, bail under BNSS)..."}
            className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-[#F5F5F0] placeholder-zinc-500 focus:outline-none max-h-44 px-1 py-1.5 leading-relaxed font-sans"
          />

          {/* Mic Button */}
          <button
            type="button"
            title={isListening ? "Stop listening" : "Start voice chat"}
            onClick={toggleVoiceInput}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 ${
              isListening
                ? "bg-rose-500 text-white shadow-lg shadow-rose-900/50 animate-pulse"
                : "btn-glass text-zinc-400 hover:text-white"
            }`}
          >
            <Mic className={`w-3.5 h-3.5 ${isListening ? "text-white" : ""}`} />
          </button>

          {/* Send / Stop Button with Purple Glow and Burst Morph */}
          <button
            onClick={() => handleTriggerSend()}
            disabled={!isGenerating && !hasText}
            title={isGenerating ? "Stop retrieval" : "Send (Enter)"}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 ${
              isGenerating
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40"
                : hasText
                  ? "btn-send-purple text-white pulse-purple-glow"
                  : "bg-white/[0.04] text-zinc-600 border border-white/5 cursor-not-allowed"
            }`}
          >
            {isBursting ? (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [1, 1.4, 0.9], opacity: 1 }}
                className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#fff]"
              />
            ) : isGenerating ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>

        <p className="text-center text-[10px] text-zinc-500 mt-2 font-sans">
          Project Access surfaces relevant Indian statutory provisions and sections. Always verify with official legal texts.
        </p>
      </div>
    </div>
  );
};
