"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Square,
  Plus,
  Mic,
  BookOpen,
  FileText,
  Gavel,
  ChevronDown,
  RotateCcw,
  History,
  SlidersHorizontal,
  Sun,
  User,
  Scale,
  ShieldAlert,
  Sparkles,
  Layers,
  Settings,
  X,
  Check,
  Search,
  Trash2,
  Pin,
  LogOut,
  Shield,
  BadgeCheck,
  Cpu,
  Volume2,
  Eye,
  Download,
  ExternalLink,
} from "lucide-react";
import { IndiaMapBackground } from "./IndiaMapBackground";
import { Chat } from "@/types";

interface HeroHomepageProps {
  onSendMessage: (query: string, isVoice?: boolean) => void;
  isGenerating: boolean;
  onStop: () => void;
  onOpenButtonSystemSheet?: () => void;
  activeMode?: "project-access" | "justice-compass";
  chats?: Chat[];
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  user?: { id: string; name: string; email: string } | null;
  onLogout?: () => void;
}

const STATUTE_MODES = [
  {
    id: "axis-2.0",
    label: "Axis 2.0 • Statutes",
    desc: "Indian Criminal & Special statutory frameworks",
  },
  {
    id: "bns",
    label: "BNS / BNSS / BSA 2023",
    desc: "Bharatiya Nyaya & Nagarik Suraksha Sanhitas",
  },
  {
    id: "pocso",
    label: "POCSO Act 2012",
    desc: "Child sexual offence provisions & mandatory rules",
  },
  {
    id: "ndps",
    label: "NDPS Act 1985",
    desc: "Search, seizure, contraband, and bail sections",
  },
  {
    id: "all",
    label: "All Indian Codes",
    desc: "Comprehensive legal citation and acts browser",
  },
];

const COMPASS_GUIDANCE_MODES = [
  {
    id: "guidance",
    label: "Compass • Guidance",
    desc: "Step-by-step procedural direction & legal routing",
  },
  {
    id: "jurisdiction",
    label: "District Court Jurisdiction",
    desc: "Local territorial & pecuniary court competencies",
  },
  {
    id: "police",
    label: "Police & FIR Procedure",
    desc: "Cognizable complaints, Zero FIR & statutory timeframes",
  },
  {
    id: "special",
    label: "Special Courts (POCSO/NDPS)",
    desc: "Fast-track designated sessions & bail tribunals",
  },
  {
    id: "hierarchy",
    label: "Appellate Hierarchy",
    desc: "High Court petitions, appeals & writ remedies",
  },
];

export const HeroHomepage: React.FC<HeroHomepageProps> = ({
  onSendMessage,
  isGenerating,
  onStop,
  onOpenButtonSystemSheet,
  activeMode = "justice-compass",
  chats = [],
  onSelectChat,
  onNewChat,
  user,
  onLogout,
}) => {
  const isCompass = activeMode === "justice-compass";
  const modesList = isCompass ? COMPASS_GUIDANCE_MODES : STATUTE_MODES;

  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState(modesList[0].id);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    "bare-act" | "judgement" | null
  >(null);
  const [isBursting, setIsBursting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHoveredRethink, setIsHoveredRethink] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [showMapGrid, setShowMapGrid] = useState(true);
  const [enableGlowRipples, setEnableGlowRipples] = useState(true);

  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.",
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setQuery(currentTranscript);

        if (event.results[0] && event.results[0].isFinal) {
          setIsListening(false);
          if (currentTranscript.trim()) {
            handleSubmit(currentTranscript.trim(), true);
          }
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Sync selectedMode when switching between Project Access and Justice Compass
  useEffect(() => {
    setSelectedMode(
      isCompass ? COMPASS_GUIDANCE_MODES[0].id : STATUTE_MODES[0].id,
    );
  }, [isCompass]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140,
      )}px`;
    }
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsModeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (textOverride?: string, overrideVoice?: boolean) => {
    const text = textOverride ?? query;
    if (!text.trim()) return;

    if (isGenerating) {
      onStop();
      return;
    }

    setIsBursting(true);
    setTimeout(() => {
      setIsBursting(false);
      onSendMessage(text.trim(), overrideVoice ?? isListening);
      setQuery("");
    }, 220);
  };

  const activeModeObj =
    modesList.find((m) => m.id === selectedMode) || modesList[0];

  const hasText = Boolean(query.trim());

  return (
    <div className="relative min-h-full w-full flex flex-col justify-between items-center select-none overflow-x-hidden p-4 sm:p-6 md:p-8 text-[#F5F5F0]">
      {/* 1. Top Right Header: ReThink Pill matching exact level of Project Access & Justice Compass */}
      <header className="fixed top-5 right-5 sm:right-7 z-20 flex items-center gap-2">
        {/* ReThink Pill Button from Figma screenshot with boundary ripple effect */}
        <motion.button
          type="button"
          onMouseEnter={() => setIsHoveredRethink(true)}
          onMouseLeave={() => setIsHoveredRethink(false)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setQuery("");
            if (textareaRef.current) textareaRef.current.focus();
          }}
          className="relative btn-glass h-10 px-4 rounded-full flex items-center gap-2 text-xs sm:text-[13px] font-medium text-zinc-300 hover:text-white bg-[#0C1418]/80 border border-white/10 hover:border-emerald-500/40 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-all cursor-pointer select-none">
          {/* Green Boundary Moving Outward Hover Effect */}
          {isHoveredRethink && (
            <>
              <div className="green-boundary-ripple pointer-events-none" />
              <div className="green-boundary-ripple-secondary pointer-events-none" />
              <div className="green-boundary-ripple-tertiary pointer-events-none" />
            </>
          )}
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>ReThink</span>
        </motion.button>
      </header>

      {/* Background Map & Grid Backdrop for Justice Compass mode */}

      {/* Background Map & Grid Backdrop for Justice Compass mode */}
      {isCompass && showMapGrid && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center z-0">
          {/* Dim light coordinate grid background matching Figma */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_95%_90%_at_50%_45%,#000_70%,transparent_100%)]" />
          <div className="absolute w-[680px] h-[680px] bg-emerald-500/[0.07] rounded-full blur-[160px] pointer-events-none translate-x-16 sm:translate-x-24" />

          {/* Authentic High-Resolution India SVG Map - Shifted to the right */}
          <div className="relative flex items-center justify-center opacity-40 translate-x-14 sm:translate-x-24 md:translate-x-32">
            <IndiaMapBackground className="w-[720px] h-[720px] sm:w-[820px] sm:h-[820px] max-w-none text-emerald-400/40" />
          </div>
        </div>
      )}

      {/* 3. Center Hero Element */}
      <main className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center text-center z-10 py-6 sm:py-10">
        {/* Official Logo Card (White Rounded Square) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-28 h-28 sm:w-32 sm:h-32 mb-6 sm:mb-8 rounded-3xl bg-white shadow-[0_12px_45px_rgba(0,0,0,0.6)] flex items-center justify-center p-3 sm:p-4 overflow-hidden border border-white/20 relative z-10">
          <img
            src={isCompass ? "/justice_compass_logo.svg" : "/logo.jpeg"}
            alt={isCompass ? "Justice Compass Logo" : "Project Access Logo"}
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        </motion.div>

        {/* Editorial Legal Serif Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3 relative z-10">
          {isCompass ? (
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight text-white leading-[1.14] font-normal">
              Justice Compass
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-white leading-[1.16] font-normal">
              <span>Describe your situation.</span>
              <br />
              <span className="italic font-normal text-zinc-200">
                Get the provisions that apply.
              </span>
            </h1>
          )}

          {/* Subline matching Figma screenshot copy with sleek location pin pointing to MP/CG */}
          {isCompass ? (
            <div className="flex flex-col items-center gap-2 mt-2">
              {/* Sleek Teardrop Location Marker pointing to Madhya Pradesh / Chhattisgarh region */}
              <div className="relative flex items-center justify-center my-1 translate-x-12 sm:translate-x-16 md:translate-x-20">
                {/* Glowing green boundary ripples moving outwards */}
                <span className="pin-boundary-glow-ripple" />
                <span className="pin-boundary-glow-ripple-2" />
                <span className="pin-boundary-glow-ripple-3" />

                {/* Inner compact glowing core boundary */}
                <span className="absolute w-5 h-5 rounded-full bg-emerald-400/[0.22] border border-emerald-400/45 shadow-[0_0_8px_rgba(52,211,153,0.5)] pointer-events-none" />

                {/* Authentic Vector Location Mark (Teardrop Pin) with delicate fine boundary */}
                <svg
                  width="14"
                  height="19"
                  viewBox="0 0 24 30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="relative z-10 drop-shadow-[0_1px_5px_rgba(74,222,128,0.45)] select-none pointer-events-none -translate-y-0.5">
                  <path
                    d="M12 0.8C6.75 0.8 2.5 5.05 2.5 10.3C2.5 16.5 12 28.5 12 28.5C12 28.5 21.5 16.5 21.5 10.3C21.5 5.05 17.25 0.8 12 0.8Z"
                    fill="url(#greenLocationPinGrad)"
                    stroke="#86EFAC"
                    strokeWidth="0.65"
                  />
                  {/* Inner dark-green hole */}
                  <circle cx="12" cy="10.3" r="2.8" fill="#041F17" />
                  <defs>
                    <linearGradient
                      id="greenLocationPinGrad"
                      x1="12"
                      y1="0.8"
                      x2="12"
                      y2="28.5"
                      gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6EE7B7" />
                      <stop offset="0.45" stopColor="#4ADE80" />
                      <stop offset="1" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-sans leading-relaxed tracking-normal italic">
                Find your bearings in the legal system — one clear step at a
                time.
              </p>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-sans leading-relaxed tracking-normal">
              Project Access surfaces the applicable Indian laws, sections,
              acts, and precedents for you to read and understand — it does not
              offer legal advice.
            </p>
          )}
        </motion.div>

        {/* 
          Centered Chat Input Box matching Figma screenshot:
          Translucent dark glass, hairline border, bottom toolbar with + mic, Compass dropdown, Bare Act, Judgement, and send button
        */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl mt-8 sm:mt-9 text-left relative z-10">
          <div
            className={`relative rounded-3xl bg-[#0E161C]/85 border transition-all duration-300 backdrop-blur-2xl p-4 sm:p-5 ${
              isFocused
                ? "border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.25),0_4px_20px_rgba(0,0,0,0.6)]"
                : "border-white/10 hover:border-white/15 shadow-[0_16px_45px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]"
            }`}>
            {/* Listening status banner */}
            {isListening && (
              <div className="mb-3 flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium backdrop-blur-md shadow-lg w-fit mx-auto animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Listening... speak your legal query now</span>
              </div>
            )}

            {/* Textarea with exact Figma placeholder */}
            <textarea
              ref={textareaRef}
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? "Listening to your voice..."
                  : isCompass
                    ? "e.g. Which court handles a cheque-bounce case in my district, and what do I file first?"
                    : "e.g. My landlord is refusing to return my security deposit after I moved out..."
              }
              className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-[#F5F5F0] placeholder-zinc-500 focus:outline-none leading-relaxed font-sans pr-2"
            />

            {/* Bottom Toolbar matching Figma layout */}
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
              {/* Left Group: +, Mic, Axis 2.0 • Statutes v, Bare Act, Judgement */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Circular + Button */}
                <button
                  type="button"
                  title="Add document / attachment"
                  onClick={() =>
                    alert(
                      "Attach FIR copy, lease agreement, or statutory legal notice.",
                    )
                  }
                  className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-zinc-400 hover:text-white">
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Circular Mic Button */}
                <button
                  type="button"
                  title={isListening ? "Stop listening" : "Voice input"}
                  onClick={toggleVoiceInput}
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                    isListening
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-900/50 animate-pulse"
                      : "btn-glass text-zinc-400 hover:text-white"
                  }`}>
                  <Mic
                    className={`w-3.5 h-3.5 ${isListening ? "text-white" : ""}`}
                  />
                </button>

                {/* Axis 2.0 • Statutes Dropdown Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModeDropdownOpen((prev) => !prev)}
                    className="btn-glass btn-glass-pill px-3 py-1.5 flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white">
                    <span>{activeModeObj.label}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isModeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl bg-[#0B1419]/95 border border-white/15 shadow-2xl p-1.5 z-30 backdrop-blur-2xl">
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        {isCompass ? "Compass Guidance" : "Statutory Engine"}
                      </div>
                      {modesList.map((mode) => {
                        const isSelected = mode.id === selectedMode;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setSelectedMode(mode.id);
                              setIsModeDropdownOpen(false);
                            }}
                            className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-xs transition-colors text-left ${
                              isSelected
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 font-medium"
                                : "text-zinc-300 hover:bg-white/5 hover:text-white"
                            }`}>
                            <Scale className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="font-medium">{mode.label}</div>
                              <div className="text-[10px] text-zinc-400 leading-snug mt-0.5">
                                {mode.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Bare Act Pill Button */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      activeFilter === "bare-act" ? null : "bare-act",
                    )
                  }
                  className={`btn-glass btn-glass-pill px-3 py-1.5 flex items-center gap-1.5 text-xs transition-all ${
                    activeFilter === "bare-act"
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-medium"
                      : "text-zinc-300 hover:text-white"
                  }`}>
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Bare Act</span>
                </button>

                {/* Judgement Pill Button */}
                <button
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      activeFilter === "judgement" ? null : "judgement",
                    )
                  }
                  className={`btn-glass btn-glass-pill px-3 py-1.5 flex items-center gap-1.5 text-xs transition-all ${
                    activeFilter === "judgement"
                      ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-medium"
                      : "text-zinc-300 hover:text-white"
                  }`}>
                  <Gavel className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Judgement</span>
                </button>
              </div>

              {/* Right: Circular Send Button with Emerald Green Gradient from Figma */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!isGenerating && !hasText}
                title={
                  isGenerating ? "Stop retrieval" : "Submit situation (Enter)"
                }
                className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer select-none transition-all duration-200 ${
                  isGenerating
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40"
                    : hasText
                      ? "btn-send-green text-white pulse-green-glow"
                      : "bg-white/[0.04] text-zinc-600 border border-white/5 cursor-not-allowed"
                }`}>
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
          </div>
        </motion.div>

        {/* Example Prompt Pills (shown for quick start) */}
        {!isCompass && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="w-full max-w-2xl mt-5 flex items-center justify-center gap-2 flex-wrap">
            {[
              {
                title: "Tenant not returning deposit",
                query:
                  "Landlord refusing to refund security deposit after vacating flat. What Indian legal provisions, criminal breach of trust sections, and remedies apply?",
              },
              {
                title: "Employer withholding salary",
                query:
                  "Company withholding salary for 3 months without notice. What labor laws, Payment of Wages Act, and statutory sections apply?",
              },
              {
                title: "Dowry harassment complaint",
                query:
                  "Dowry demand and harassment by husband and in-laws. What statutory sections under BNS 85/86 and Domestic Violence Act apply?",
              },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmit(item.query)}
                className="btn-glass btn-glass-pill px-3.5 py-1.5 inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{item.title}</span>
              </button>
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer Disclaimer matching Figma screenshot */}
      <footer className="w-full flex items-center justify-between z-10 pb-2 pt-2 px-1 sm:px-4">
        {/* Bottom Left: Manage cookies button from Figma screenshot */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() =>
              alert(
                "Cookie preferences: Essential analytical and statutory session cookies enabled.",
              )
            }
            className="btn-glass px-3 py-1.5 rounded-xl text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-[#0C1418]/80 border border-white/10 transition-colors">
            Manage cookies or opt out
          </button>
        </div>

        {/* Center disclaimer */}
        <p className="flex-1 text-center text-[11px] text-zinc-400 tracking-wide font-sans px-2">
          {isCompass
            ? "Justice Compass provides directional guidance, not legal advice. Consult an advocate for representation."
            : "Project Access provides statutory section references from Indian Codes. Consult a registered Advocate for case representation."}
        </p>

        {/* Right spacer for balance */}
        <div className="w-36 hidden sm:block shrink-0" />
      </footer>
    </div>
  );
};
