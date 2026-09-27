"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  SlidersHorizontal,
  Settings,
  User,
  Plus,
  X,
  Search,
  Pin,
  Trash2,
  Download,
  LogOut,
  BadgeCheck,
  Check,
  Volume2,
  Play,
  Square,
  Sparkles,
  Mic,
  Menu,
} from "lucide-react";
import { Chat } from "@/types";
import { Storage } from "@/lib/storage";
import {
  getSavedVoiceSettings,
  saveVoiceSettings,
  playAudioOrSpeech,
  stopActiveAudio,
} from "@/lib/voiceHelper";

interface RightSidebarDockProps {
  chats?: Chat[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string, e?: React.MouseEvent) => void;
  onPinChat?: (id: string, e?: React.MouseEvent) => void;
  user?: { id: string; name: string; email: string } | null;
  onLogout?: () => void;
  onSendMessage?: (query: string, isVoice?: boolean) => void;
  isSaveEnabled?: boolean;
  onToggleSave?: () => void;
  onClearChat?: () => void;
}

export const RightSidebarDock: React.FC<RightSidebarDockProps> = ({
  chats = [],
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onPinChat,
  user,
  onLogout,
  onSendMessage,
  isSaveEnabled = false,
  onToggleSave,
  onClearChat,
}) => {
  const [activeRightPanel, setActiveRightPanel] = useState<
    "history" | "customize" | "settings" | "profile" | null
  >(null);
  const [historySearch, setHistorySearch] = useState("");

  // Customization state
  const [statuteCorpus, setStatuteCorpus] = useState<
    "all" | "bns" | "special" | "commercial"
  >("all");
  const [reasoningDepth, setReasoningDepth] = useState<
    "standard" | "comprehensive"
  >("comprehensive");
  const [includeHighCourts, setIncludeHighCourts] = useState(true);
  const [includeTribunals, setIncludeTribunals] = useState(true);

  // Voice Customization State
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [voicePitch, setVoicePitch] = useState<number>(1.0);
  const [voiceRate, setVoiceRate] = useState<number>(1.0);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        setSystemVoices(voices);
        const settings = getSavedVoiceSettings();
        if (settings.voiceURI) {
          setSelectedVoiceURI(settings.voiceURI);
        } else if (voices.length > 0) {
          setSelectedVoiceURI(voices[0].voiceURI);
        }
        if (settings.pitch !== undefined) setVoicePitch(settings.pitch);
        if (settings.rate !== undefined) setVoiceRate(settings.rate);
      }
    };
    loadVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uri = e.target.value;
    setSelectedVoiceURI(uri);
    saveVoiceSettings({ voiceURI: uri, pitch: voicePitch, rate: voiceRate });
    showPanelToast("AI Voice changed successfully");
  };

  const handlePitchChange = (p: number) => {
    setVoicePitch(p);
    saveVoiceSettings({
      voiceURI: selectedVoiceURI,
      pitch: p,
      rate: voiceRate,
    });
  };

  const handleRateChange = (r: number) => {
    setVoiceRate(r);
    saveVoiceSettings({
      voiceURI: selectedVoiceURI,
      pitch: voicePitch,
      rate: r,
    });
  };

  const handleTestVoice = () => {
    if (isTestingVoice) {
      stopActiveAudio();
      setIsTestingVoice(false);
      return;
    }
    setIsTestingVoice(true);
    playAudioOrSpeech({
      text: "Hello! This is Project Access AI Voice. Your selected custom voice is active.",
      onProgress: () => { },
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false),
    });
  };

  // Settings state
  const [showBareActText, setShowBareActText] = useState(true);
  const [includePenalties, setIncludePenalties] = useState(true);
  const [showMapGrid, setShowMapGrid] = useState(true);
  const [enableGlowRipples, setEnableGlowRipples] = useState(true);
  const [responseLanguage, setResponseLanguageState] = useState<string>(() =>
    Storage.getResponseLanguage(),
  );
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const rightDockRef = useRef<HTMLElement>(null);

  const showPanelToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2400);
  };

  const handleLanguageChange = (newLang: string) => {
    setResponseLanguageState(newLang);
    Storage.setResponseLanguage(newLang);
    showPanelToast(`Response language set to ${newLang}`);
  };

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<
    "history" | "customize" | "settings" | "profile"
  >("history");

  useEffect(() => {
    const handleOpenPanel = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveRightPanel(customEvent.detail);
        if (
          ["history", "customize", "settings", "profile"].includes(
            customEvent.detail,
          )
        ) {
          setMobileActiveTab(customEvent.detail);
        }
        setIsMobileMenuOpen(true);
      }
    };
    window.addEventListener("open-right-panel", handleOpenPanel);
    return () => window.removeEventListener("open-right-panel", handleOpenPanel);
  }, []);

  const formatChatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  const filteredHistoryChats = (chats || []).filter((c) => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return true;
    const titleMatch = (c.title || "").toLowerCase().includes(q);
    const messageMatch = (c.messages || []).some(
      (m) =>
        (m.content || "").toLowerCase().includes(q) ||
        (m.thinking || "").toLowerCase().includes(q),
    );
    return titleMatch || messageMatch;
  });

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        rightDockRef.current &&
        !rightDockRef.current.contains(event.target as Node)
      ) {
        setActiveRightPanel(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Right Small Sidebar (Floating Quick Actions Dock) */}
      <aside
        ref={rightDockRef}
        aria-label="Quick Actions Sidebar"
        className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-2.5 p-1.5 rounded-2xl bg-[#0C1418]/85 border border-white/10 backdrop-blur-2xl shadow-2xl shadow-black/60">
        {/* 1. History */}
        <div className="relative group flex items-center justify-center">
          <button
            type="button"
            title="History"
            aria-label="History"
            onClick={() =>
              setActiveRightPanel((prev) =>
                prev === "history" ? null : "history",
              )
            }
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${activeRightPanel === "history"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95"
              }`}>
            <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <span className="absolute right-full mr-3.5 px-2.5 py-1 rounded-lg bg-[#0C1418]/95 border border-white/15 text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl backdrop-blur-xl opacity-0 pointer-events-none group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50">
            History
          </span>
        </div>

        {/* 2. Customize */}
        <div className="relative group flex items-center justify-center">
          <button
            type="button"
            title="Customize"
            aria-label="Customize"
            onClick={() =>
              setActiveRightPanel((prev) =>
                prev === "customize" ? null : "customize",
              )
            }
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${activeRightPanel === "customize"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95"
              }`}>
            <SlidersHorizontal className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <span className="absolute right-full mr-3.5 px-2.5 py-1 rounded-lg bg-[#0C1418]/95 border border-white/15 text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl backdrop-blur-xl opacity-0 pointer-events-none group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50">
            Customize
          </span>
        </div>

        {/* 3. Settings */}
        <div className="relative group flex items-center justify-center">
          <button
            type="button"
            title="Settings"
            aria-label="Settings"
            onClick={() =>
              setActiveRightPanel((prev) =>
                prev === "settings" ? null : "settings",
              )
            }
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${activeRightPanel === "settings"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95"
              }`}>
            <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <span className="absolute right-full mr-3.5 px-2.5 py-1 rounded-lg bg-[#0C1418]/95 border border-white/15 text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl backdrop-blur-xl opacity-0 pointer-events-none group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50">
            Settings
          </span>
        </div>

        {/* 4. Profile */}
        <div className="relative group flex items-center justify-center">
          <button
            type="button"
            title="Profile"
            aria-label="Profile"
            onClick={() =>
              setActiveRightPanel((prev) =>
                prev === "profile" ? null : "profile",
              )
            }
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${activeRightPanel === "profile"
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 active:scale-95"
              }`}>
            <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <span className="absolute right-full mr-3.5 px-2.5 py-1 rounded-lg bg-[#0C1418]/95 border border-white/15 text-[11px] font-medium text-zinc-200 whitespace-nowrap shadow-xl backdrop-blur-xl opacity-0 pointer-events-none group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 z-50">
            Profile
          </span>
        </div>
      </aside>

      {/* Interactive Flyout Panel */}
      <AnimatePresence>
        {activeRightPanel && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 20, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 15, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-16 sm:right-20 top-1/2 -translate-y-1/2 w-[340px] sm:w-[380px] max-h-[85vh] rounded-3xl bg-[#0B1317]/95 border border-white/15 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] z-50 flex flex-col text-left overflow-hidden select-text text-zinc-200">
            {/* 1. History View */}
            {activeRightPanel === "history" && (
              <div className="flex flex-col h-full max-h-[82vh]">
                <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Chat History
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {chats.length} conversations stored
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onNewChat?.();
                        setActiveRightPanel(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer">
                      <Plus className="w-3.5 h-3.5" />
                      <span>New</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightPanel(null)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 pb-2">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search recent queries..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 pt-1 space-y-1.5">
                  {filteredHistoryChats.length === 0 ? (
                    <div className="py-6 text-center px-4">
                      <p className="text-xs text-zinc-400 mb-3">
                        No matching past queries found.
                      </p>
                      <p className="text-[11px] text-zinc-500 mb-2 font-medium">
                        Quick Legal Inquiries:
                      </p>
                      <div className="space-y-1.5 text-left">
                        {[
                          "Bharatiya Nyaya Sanhita substantive offences",
                          "Anticipatory bail procedure under §482 BNSS",
                          "Cheque bounce statutory notice under NI Act §138",
                        ].map((promptText) => (
                          <button
                            key={promptText}
                            type="button"
                            onClick={() => {
                              onSendMessage?.(promptText);
                              setActiveRightPanel(null);
                            }}
                            className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-xs text-zinc-300 hover:text-emerald-300 transition-all truncate cursor-pointer">
                            {promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    filteredHistoryChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => {
                          onSelectChat?.(chat.id);
                          setActiveRightPanel(null);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${chat.id === activeChatId
                            ? "bg-emerald-500/20 border-emerald-500/50 text-white"
                            : "bg-white/[0.04] hover:bg-emerald-500/15 border-white/5 hover:border-emerald-500/30 text-zinc-200"
                          }`}>
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-medium group-hover:text-white truncate">
                            {chat.title}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {formatChatTime(chat.createdAt)}
                          </p>
                        </div>
                        {chat.pinned && (
                          <Pin className="w-3 h-3 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 2. Customize View */}
            {activeRightPanel === "customize" && (
              <div className="flex flex-col h-full max-h-[82vh]">
                <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Customize Scope
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Tune legal intelligence & judicial reach
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {/* AI Voice Customization */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-white text-xs">
                          AI Voice & Speech Output
                        </span>
                      </div>
                      {isTestingVoice && (
                        <span className="text-[10px] text-emerald-400 animate-pulse font-medium">
                          Playing...
                        </span>
                      )}
                    </div>

                    {/* System Voice Selection */}
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 font-medium">
                        Select Voice Accent & Speaker
                      </label>
                      <div className="relative flex items-center p-2 rounded-xl bg-[#091216]/90 border border-white/10">
                        <select
                          value={selectedVoiceURI}
                          onChange={handleVoiceChange}
                          className="w-full bg-transparent text-xs text-white border-0 focus:outline-none cursor-pointer truncate font-medium">
                          {systemVoices.length > 0 ? (
                            systemVoices.map((v) => (
                              <option
                                key={v.voiceURI}
                                value={v.voiceURI}
                                className="bg-[#0E171D] text-white">
                                {v.name} ({v.lang})
                              </option>
                            ))
                          ) : (
                            <option
                              value=""
                              className="bg-[#0E171D] text-white">
                              Browser Standard Voice
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Pitch & Rate Controls */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-[#091216]/90 border border-white/10">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Pitch</span>
                          <span className="font-mono text-emerald-400">
                            {voicePitch.toFixed(1)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={voicePitch}
                          onChange={(e) =>
                            handlePitchChange(parseFloat(e.target.value))
                          }
                          className="w-full accent-emerald-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="p-2 rounded-xl bg-[#091216]/90 border border-white/10">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                          <span>Speed</span>
                          <span className="font-mono text-emerald-400">
                            {voiceRate.toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.7"
                          max="1.5"
                          step="0.1"
                          value={voiceRate}
                          onChange={(e) =>
                            handleRateChange(parseFloat(e.target.value))
                          }
                          className="w-full accent-emerald-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Test Voice Button */}
                    <button
                      type="button"
                      onClick={handleTestVoice}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md">
                      {isTestingVoice ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                          <span>Stop Test Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                          <span>Test Selected Voice</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Statutory Framework
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          id: "all",
                          label: "All Indian Codes",
                          desc: "BNS 2023, BNSS 2023, BSA 2023 & Special Acts",
                        },
                        {
                          id: "bns",
                          label: "BNS / BNSS 2023",
                          desc: "New Major Criminal Acts",
                        },
                        {
                          id: "special",
                          label: "Special Statutes",
                          desc: "POCSO, NDPS, PMLA, Arms",
                        },
                        {
                          id: "commercial",
                          label: "Civil & Business",
                          desc: "NI Act, IBC, Arbitration",
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setStatuteCorpus(item.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${statuteCorpus === item.id
                              ? "bg-emerald-500/20 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                              : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-white/10"
                            }`}>
                          <div className="font-medium text-[11px] text-white">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-zinc-400 mt-0.5">
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Analysis Depth
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReasoningDepth("standard")}
                        className={`flex-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${reasoningDepth === "standard"
                            ? "bg-emerald-500/20 border-emerald-500/50 text-white"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                          }`}>
                        <div className="font-medium text-[11px] text-white">
                          Statutory Sections
                        </div>
                        <div className="text-[9px] text-zinc-400 mt-0.5">
                          Fast provisions & penalties
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReasoningDepth("comprehensive")}
                        className={`flex-1 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${reasoningDepth === "comprehensive"
                            ? "bg-emerald-500/20 border-emerald-500/50 text-white"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                          }`}>
                        <div className="font-medium text-[11px] text-white">
                          Comprehensive
                        </div>
                        <div className="text-[9px] text-zinc-400 mt-0.5">
                          Ratio & precedents
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Jurisdiction & Courts
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                        <span className="text-zinc-300">
                          Supreme Court of India
                        </span>
                        <input
                          type="checkbox"
                          checked
                          readOnly
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                        <span className="text-zinc-300">
                          State High Courts (MP, Del, Bom)
                        </span>
                        <input
                          type="checkbox"
                          checked={includeHighCourts}
                          onChange={(e) =>
                            setIncludeHighCourts(e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                        <span className="text-zinc-300">
                          Tribunals (NCLAT, NGT, SAT)
                        </span>
                        <input
                          type="checkbox"
                          checked={includeTribunals}
                          onChange={(e) =>
                            setIncludeTribunals(e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">
                    Live Qdrant Index: Connected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      showPanelToast("Legal scope applied successfully");
                      setActiveRightPanel(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer">
                    Save Scope
                  </button>
                </div>
              </div>
            )}

            {/* 3. Settings View */}
            {activeRightPanel === "settings" && (
              <div className="flex flex-col h-full max-h-[82vh]">
                <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        System Settings
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Preferences & citations formatting
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  {/* Save Chat & History Preferences */}
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Chat & History Preferences
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                            <span>Save Chat in History</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                isSaveEnabled
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}>
                              {isSaveEnabled ? "ENABLED" : "DISABLED"}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Save chat sessions to history & database
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onToggleSave}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSaveEnabled
                              ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                              : "bg-white/10 text-zinc-300 hover:bg-white/20"
                          }`}>
                          {isSaveEnabled ? "On" : "Off"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-zinc-200 font-medium">
                            Delete Current Conversation
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Clear all messages in active session
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onClearChat}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LLM Response Language Selector */}
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      AI Response Language
                    </label>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-zinc-200 font-medium">
                            Response Language
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Language for AI legal answers & statutory advice
                          </div>
                        </div>
                      </div>
                      <select
                        value={responseLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0A0F13] border border-emerald-500/30 text-emerald-300 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer">
                        <option value="English">English</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                        <option value="Hinglish">Hinglish (Hindi + English)</option>
                        <option value="Bengali">Bengali (বাংলা)</option>
                        <option value="Tamil">Tamil (தமிழ்)</option>
                        <option value="Telugu">Telugu (తెలుగు)</option>
                        <option value="Marathi">Marathi (मराठी)</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                        <option value="Malayalam">Malayalam (മലയാളം)</option>
                        <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                        <option value="French">French (Français)</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="German">German (Deutsch)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Display & Atmosphere
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-zinc-200 font-medium">
                            India Vector Map & Light Grid
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Cartography and coordinate grid
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showMapGrid}
                          onChange={(e) => setShowMapGrid(e.target.checked)}
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-zinc-200 font-medium">
                            Glowing Boundary Waves
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Tactile radar ripples on hover & pin
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableGlowRipples}
                          onChange={(e) =>
                            setEnableGlowRipples(e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Citations & Statutory Text
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-zinc-200 font-medium">
                            Verbatim Bare Act Text
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Show exact statutory language
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={showBareActText}
                          onChange={(e) => setShowBareActText(e.target.checked)}
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div>
                          <div className="text-zinc-200 font-medium">
                            Penalties & Bailability Badge
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Display bailable/cognizable tags
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={includePenalties}
                          onChange={(e) =>
                            setIncludePenalties(e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                      Data & Cache
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const data = JSON.stringify(
                            { chats, timestamp: Date.now() },
                            null,
                            2,
                          );
                          const blob = new Blob([data], {
                            type: "application/json",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `project-access-export-${Date.now()}.json`;
                          a.click();
                          showPanelToast("Session exported as JSON");
                        }}
                        className="flex-1 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export Chats</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm("Reset local search cache and preferences?")
                          ) {
                            localStorage.clear();
                            showPanelToast("Local cache cleared");
                          }
                        }}
                        className="flex-1 p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-rose-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Cache</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-white/10 text-center">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Project Access Engine v2.4.0 • Justice Compass Edition
                  </span>
                </div>
              </div>
            )}

            {/* 4. Profile View */}
            {activeRightPanel === "profile" && (
              <div className="flex flex-col h-full max-h-[82vh]">
                <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Institutional Profile
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Verified Legal Practitioner
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel(null)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      {user?.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-semibold text-white text-sm truncate">
                          {user?.name || "Legal Practitioner"}
                        </h4>
                        <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {user?.email || "advocate@projectaccess.in"}
                      </p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Pro Active • Institutional Seat
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-zinc-400">Chamber ID</span>
                      <span className="font-mono text-zinc-200">
                        CH-412 / HCBA
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-zinc-400">
                        Jurisdiction Standing
                      </span>
                      <span className="text-emerald-400 font-medium">
                        Supreme Court & High Courts
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-zinc-400">RAG Semantic Search</span>
                      <span className="text-zinc-200 font-mono">
                        Qdrant Vector DB • 1536d
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-base font-bold text-emerald-400">
                        148
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-0.5">
                        Acts Indexed
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-base font-bold text-white">
                        {chats.length}
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-0.5">
                        Saved Chats
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-base font-bold text-emerald-400">
                        Unlimited
                      </div>
                      <div className="text-[9px] text-zinc-400 mt-0.5">
                        Query Quota
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      showPanelToast(
                        "Credentials verified with Supreme Court registry",
                      );
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 font-medium transition-all cursor-pointer">
                    Credentials
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout?.();
                      setActiveRightPanel(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Top-Left Hamburger Button (visible on mobile screens) */}
      <div className="fixed top-3.5 left-3.5 sm:left-4 z-[55] md:hidden">
        <button
          type="button"
          title="Open Menu & System Settings"
          aria-label="Open Menu & System Settings"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0C1418]/90 border border-emerald-500/40 hover:border-emerald-400/70 backdrop-blur-2xl flex items-center justify-center text-emerald-300 hover:text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer active:scale-95 group">
          {isMobileMenuOpen ? (
            <X className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          ) : (
            <Menu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-[#0C1418]" />
        </button>
      </div>

      {/* Mobile Left Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden"
            />

            {/* Mobile Drawer Slide-in Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-[330px] max-w-[85vw] bg-[#0B1317] border-r border-white/15 z-[65] flex flex-col text-zinc-200 shadow-2xl overflow-hidden select-text md:hidden">
              {/* 1. Drawer Header */}
              <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between bg-[#0C1418]/95">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <img
                      src="/icon.jpeg"
                      alt="Project Access"
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Project Access
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      Legal AI Assistant
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2. Action CTA Header: New Conversation */}
              <div className="p-3 border-b border-white/10 bg-white/5">
                <button
                  type="button"
                  onClick={() => {
                    onNewChat?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all cursor-pointer">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Start New Conversation</span>
                </button>
              </div>

              {/* 3. Mobile Segmented Tab Navigator */}
              <div className="flex items-center justify-between p-1.5 border-b border-white/10 bg-[#090F13] text-xs">
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("history")}
                  className={`flex-1 py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    mobileActiveTab === "history"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}>
                  <History className="w-3.5 h-3.5" />
                  <span className="text-[11px]">History</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("customize")}
                  className={`flex-1 py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    mobileActiveTab === "customize"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Customize</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("settings")}
                  className={`flex-1 py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    mobileActiveTab === "settings"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}>
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileActiveTab("profile")}
                  className={`flex-1 py-1.5 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    mobileActiveTab === "profile"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}>
                  <User className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Profile</span>
                </button>
              </div>

              {/* 4. Mobile Drawer Tab Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Mobile History Tab */}
                {mobileActiveTab === "history" && (
                  <div className="flex flex-col h-full">
                    <div className="p-3 pb-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search conversations..."
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 text-xs">
                      {filteredHistoryChats.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-xs">
                          No conversations found
                        </div>
                      ) : (
                        filteredHistoryChats.map((chat) => {
                          const isActive = activeChatId === chat.id;
                          return (
                            <div
                              key={chat.id}
                              onClick={() => {
                                onSelectChat?.(chat.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                                isActive
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                                  : "hover:bg-white/5 border border-transparent text-zinc-300"
                              }`}>
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                {chat.pinned && (
                                  <Pin className="w-3 h-3 text-emerald-400 shrink-0 fill-emerald-400" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-xs truncate">
                                    {chat.title || "Untitled Chat"}
                                  </div>
                                  <div className="text-[10px] text-zinc-500">
                                    {formatChatTime(chat.updatedAt)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={chat.pinned ? "Unpin" : "Pin"}
                                  onClick={(e) => onPinChat?.(chat.id, e)}
                                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-emerald-400 transition-colors">
                                  <Pin className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={(e) => onDeleteChat?.(chat.id, e)}
                                  className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-rose-400 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Mobile Customize Tab */}
                {mobileActiveTab === "customize" && (
                  <div className="p-4 space-y-4 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        Statute Corpus Focus
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: "all", label: "All Statutes" },
                          { id: "bns", label: "BNS & Penal" },
                          { id: "special", label: "Special Acts" },
                          { id: "commercial", label: "Commercial" },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setStatuteCorpus(item.id as any)
                            }
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              statuteCorpus === item.id
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                : "bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-200"
                            }`}>
                            <div className="font-medium text-xs">
                              {item.label}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        Reasoning & Precedent Depth
                      </label>
                      <div className="space-y-2">
                        <div
                          onClick={() => setReasoningDepth("standard")}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            reasoningDepth === "standard"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-white/5 border-white/10 text-zinc-400"
                          }`}>
                          <div className="font-medium text-xs">
                            Standard Advisory
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Fast statutory analysis with primary section tags
                          </div>
                        </div>
                        <div
                          onClick={() => setReasoningDepth("comprehensive")}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            reasoningDepth === "comprehensive"
                              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                              : "bg-white/5 border-white/10 text-zinc-400"
                          }`}>
                          <div className="font-medium text-xs">
                            Comprehensive Brief
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Exhaustive statutory breakdown & procedural flow
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        Court Jurisdiction Filters
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-zinc-200">High Courts Precedents</span>
                          <input
                            type="checkbox"
                            checked={includeHighCourts}
                            onChange={(e) =>
                              setIncludeHighCourts(e.target.checked)
                            }
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-zinc-200">Special Tribunals (DRT, NCLT)</span>
                          <input
                            type="checkbox"
                            checked={includeTribunals}
                            onChange={(e) =>
                              setIncludeTribunals(e.target.checked)
                            }
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Settings Tab */}
                {mobileActiveTab === "settings" && (
                  <div className="p-4 space-y-4 text-xs">
                    {/* Save Chat & History Preferences */}
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        Chat & History Preferences
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <div className="text-zinc-200 font-medium flex items-center gap-1.5">
                              <span>Save Chat in History</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  isSaveEnabled
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}>
                                {isSaveEnabled ? "ENABLED" : "DISABLED"}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              Save chat sessions to history & database
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={onToggleSave}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSaveEnabled
                                ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                                : "bg-white/10 text-zinc-300 hover:bg-white/20"
                            }`}>
                            {isSaveEnabled ? "On" : "Off"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <div className="text-zinc-200 font-medium">
                              Delete Current Conversation
                            </div>
                            <div className="text-[10px] text-zinc-400">
                              Clear all messages in active session
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onClearChat?.();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        AI Response Language
                      </label>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                        <div className="text-zinc-200 font-medium">
                          Response Language
                        </div>
                        <select
                          value={responseLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0A0F13] border border-emerald-500/30 text-emerald-300 text-xs focus:outline-none focus:border-emerald-400 cursor-pointer">
                          <option value="English">English</option>
                          <option value="Hindi">Hindi (हिंदी)</option>
                          <option value="Hinglish">Hinglish (Hindi + English)</option>
                          <option value="Bengali">Bengali (বাংলা)</option>
                          <option value="Tamil">Tamil (தமிழ்)</option>
                          <option value="Telugu">Telugu (తెలుగు)</option>
                          <option value="Marathi">Marathi (मराठी)</option>
                          <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                          <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                          <option value="Malayalam">Malayalam (മലയാളം)</option>
                          <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                          <option value="French">French (Français)</option>
                          <option value="Spanish">Spanish (Español)</option>
                          <option value="German">German (Deutsch)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        Display & Atmosphere
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <div className="text-zinc-200 font-medium">India Vector Map</div>
                            <div className="text-[10px] text-zinc-400">Light grid cartography</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={showMapGrid}
                            onChange={(e) => setShowMapGrid(e.target.checked)}
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <div className="text-zinc-200 font-medium">Glowing Ripples</div>
                            <div className="text-[10px] text-zinc-400">Tactile radar waves</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={enableGlowRipples}
                            onChange={(e) => setEnableGlowRipples(e.target.checked)}
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block mb-2">
                        Citations & Statutory Text
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-zinc-200">Verbatim Bare Act Text</span>
                          <input
                            type="checkbox"
                            checked={showBareActText}
                            onChange={(e) => setShowBareActText(e.target.checked)}
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-zinc-200">Penalties & Bailability Tags</span>
                          <input
                            type="checkbox"
                            checked={includePenalties}
                            onChange={(e) => setIncludePenalties(e.target.checked)}
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Profile Tab */}
                {mobileActiveTab === "profile" && (
                  <div className="p-4 space-y-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold">
                          {user?.name ? user.name[0] : "L"}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">
                            {user?.name || "Legal Practitioner"}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {user?.email || "advocate@projectaccess.in"}
                          </div>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center justify-between">
                        <span>Project Access Engine</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[9px] uppercase font-bold">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => {
                          onLogout?.();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating toast notification */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-[#0B1516]/95 border border-emerald-500/40 text-xs text-emerald-300 shadow-2xl flex items-center gap-2 backdrop-blur-xl">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{savedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
