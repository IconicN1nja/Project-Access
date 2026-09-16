"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  ArrowUp,
  Square,
  Sparkles,
  BookOpen,
  ShieldAlert,
  Scale,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Clock,
  Bookmark,
  Share2,
  PanelLeft,
} from "lucide-react";
import { PROMPT_TEMPLATES } from "@/lib/storage";

interface HeroHomepageProps {
  onSendMessage: (query: string) => void;
  isGenerating: boolean;
  onStop: () => void;
  user: { id: string; email: string; name: string } | null;
  onOpenSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const STATUTE_MODES = [
  { id: "all", label: "All Statutes & Acts", icon: Scale },
  { id: "bns", label: "BNS / BNSS / BSA (New Codes)", icon: BookOpen },
  { id: "pocso", label: "POCSO & Special Acts", icon: ShieldAlert },
  { id: "ndps", label: "NDPS & Narcotics", icon: FileText },
];

export const HeroHomepage: React.FC<HeroHomepageProps> = ({
  onSendMessage,
  isGenerating,
  onStop,
  user,
  isSidebarOpen,
  onOpenSidebar,
}) => {
  const [query, setQuery] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
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

  const handleSubmit = (textOverride?: string) => {
    const text = textOverride ?? query;
    if (!text.trim()) return;
    if (isGenerating) {
      onStop();
      return;
    }
    onSendMessage(text.trim());
    setQuery("");
  };

  const activeModeObj =
    STATUTE_MODES.find((m) => m.id === selectedMode) || STATUTE_MODES[0];

  return (
    <div className="relative min-h-full w-full flex flex-col justify-between items-center text-slate-100 select-none overflow-x-hidden p-4 sm:p-6 md:p-8 bg-[#18212e] hero-bg-mesh">
      {/* Subtle Ambient Radial Glow Layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top center teal-emerald aura */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-emerald-600/15 rounded-full blur-[140px]" />
        {/* Bottom-left muted green glow */}
        <div className="absolute -bottom-24 -left-20 w-[550px] h-[550px] bg-teal-700/15 rounded-full blur-[160px]" />
        {/* Right side indigo/slate ambient tone */}
        <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] bg-sky-800/15 rounded-full blur-[150px]" />
      </div>

      {/* 1. Top Bar Pill Badges */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 pt-1 pb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sidebar Toggle button if collapsed */}
          {!isSidebarOpen && onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              title="Open conversations sidebar (⌘B)"
              className="p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900 border border-slate-700/50 backdrop-blur-md text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-center"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* Project Access Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 border border-slate-700/50 backdrop-blur-md shadow-sm transition-all text-xs font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="tracking-tight">Project Access</span>
            <span className="text-[10px] text-slate-400 pl-1 border-l border-slate-700/60">
              v1.0
            </span>
          </div>

          {/* Legal Compass Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md shadow-sm transition-all text-xs font-medium text-emerald-300">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Legal Compass</span>
          </div>
        </div>

        {/* Top Right: User pill / Pro Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 backdrop-blur-md text-xs font-medium text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Statutory AI</span>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
              Active
            </span>
          </div>
        </div>
      </header>

      {/* Right Floating Vertical Dock / Tool Palette (as seen in Figma) */}
      <aside
        aria-label="Quick Actions"
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2.5 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-700/40 backdrop-blur-xl shadow-xl shadow-black/20"
      >
        <button
          title="Recent Queries / Timeline"
          onClick={() => handleSubmit("Summarize key changes in Bharatiya Nyaya Sanhita (BNS) compared to IPC")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-all group"
        >
          <Clock className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
        <button
          title="Saved Statutes"
          onClick={() => handleSubmit("Provide a complete breakdown of bail provisions under BNSS 2023")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-all group"
        >
          <Bookmark className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
        <button
          title="Statutory Search Index"
          onClick={() => handleSubmit("Explain Section 42 and 50 search and seizure mandates under NDPS Act")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-all group"
        >
          <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
        <button
          title="Legal Info & Sources"
          onClick={() => handleSubmit("What are the mandatory reporting requirements and penalties under POCSO Act?")}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-300 hover:bg-slate-800/80 transition-all group"
        >
          <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      </aside>

      {/* 2. Hero Center Section */}
      <main className="w-full max-w-3xl mx-auto my-auto flex flex-col items-center text-center z-10 py-6 sm:py-10">
        {/* Minimal White Pillar Accent Graphic from Figma */}
        <div className="w-2 sm:w-2.5 h-10 sm:h-12 bg-white rounded-full mb-6 sm:mb-8 shadow-[0_0_24px_rgba(255,255,255,0.7)] animate-pulse" />

        {/* Hero Headlines: Serif italic elegance matching the Figma design */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-white leading-tight font-normal">
          <span>Describe your situation.</span>
          <br />
          <span className="italic font-normal text-slate-200">
            Get the provisions that apply.
          </span>
        </h1>

        {/* Subtitle / Description */}
        <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-slate-400 max-w-xl font-sans leading-relaxed tracking-normal">
          Empowering citizens and legal practitioners with verified statutory guidance,
          procedural timelines, and grounded legal references across Indian Criminal Law.
        </p>

        {/* 3. Floating Glass Input Card */}
        <div className="w-full max-w-2xl mt-8 sm:mt-10">
          <div className="relative rounded-2xl bg-slate-900/70 border border-slate-700/60 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-3 sm:p-4 text-left transition-all duration-200 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={2}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Police stopped and searched a vehicle without a warrant under NDPS..."
              className="w-full bg-transparent border-0 resize-none text-xs sm:text-sm text-slate-100 placeholder-slate-400/80 focus:outline-none leading-relaxed font-sans pr-2"
            />

            {/* Bottom Controls inside the Glass Box */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Statute Scope / Mode Selector */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsModeDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
                  >
                    <activeModeObj.icon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[140px] sm:max-w-[180px]">
                      {activeModeObj.label}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* Mode Dropdown Menu */}
                  {isModeDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 rounded-xl bg-slate-900 border border-slate-700/70 shadow-2xl p-1.5 z-30 backdrop-blur-xl">
                      <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Search Domain
                      </div>
                      {STATUTE_MODES.map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = mode.id === selectedMode;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              setSelectedMode(mode.id);
                              setIsModeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                              isSelected
                                ? "bg-emerald-500/15 text-emerald-300 font-medium"
                                : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Secondary action / Filter indicator */}
                <button
                  type="button"
                  onClick={() =>
                    setQuery((prev) =>
                      prev ? prev : "What are the legal provisions and penalties for "
                    )
                  }
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-700/40 transition-colors"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Provisions Lookup</span>
                </button>
              </div>

              {/* Send Button (Green circular button with up arrow, matching Figma) */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!isGenerating && !query.trim()}
                title={isGenerating ? "Stop generating" : "Send query (Enter)"}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                  isGenerating
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                    : query.trim()
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                    : "bg-emerald-500/20 text-emerald-500/40 cursor-not-allowed border border-emerald-500/20"
                }`}
              >
                {isGenerating ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="w-full max-w-2xl mt-4 flex items-center justify-center gap-2 flex-wrap">
          {PROMPT_TEMPLATES.slice(0, 3).map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSubmit(tpl.prompt)}
              className="text-[11px] sm:text-xs text-slate-300 hover:text-emerald-300 bg-slate-900/50 hover:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
              <span>{tpl.title}</span>
            </button>
          ))}
        </div>
      </main>

      {/* 4. Footer Disclaimer */}
      <footer className="w-full text-center z-10 pt-4 pb-2">
        <p className="text-[11px] text-slate-400/80 tracking-wide font-sans">
          Project Access provides statutory references for informational purposes. Always verify with statutory texts.
        </p>
      </footer>
    </div>
  );
};
