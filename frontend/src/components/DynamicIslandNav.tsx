"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  History,
  BookOpen,
  Bookmark,
  Search,
  Settings,
  User,
  Star,
  ChevronDown,
  ChevronUp,
  Compass,
  RotateCcw,
  ArrowRight,
  LogOut,
  X,
  Trash2,
  Pin,
  Sparkles,
  Scale,
  Send,
} from "lucide-react";
import { Chat } from "@/types";

interface DynamicIslandNavProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  onPinChat: (id: string, e: React.MouseEvent) => void;
  user: { id: string; name: string; email: string } | null;
  onLogout: () => void;
  onSelectStatute?: (statute: string) => void;
  onOpenButtonSystemSheet?: () => void;
  forcedState?: "idle" | "hover" | "expanded" | null;
  activeMode?: "project-access" | "justice-compass";
  onModeChange?: (mode: "project-access" | "justice-compass") => void;
}

const STATUTE_CATEGORIES = [
  {
    id: "bns",
    name: "BNS 2023",
    desc: "Bharatiya Nyaya Sanhita (Substantive Offences)",
  },
  {
    id: "bnss",
    name: "BNSS 2023",
    desc: "Bharatiya Nagarik Suraksha Sanhita (Procedure & Bail)",
  },
  {
    id: "pocso",
    name: "POCSO Act 2012",
    desc: "Protection of Children from Sexual Offences",
  },
  {
    id: "ndps",
    name: "NDPS Act 1985",
    desc: "Narcotic Drugs & Psychotropic Substances",
  },
  {
    id: "arms",
    name: "Arms Act 1959",
    desc: "Firearms, licensing & illegal possession",
  },
  {
    id: "uapa",
    name: "UAPA 1967",
    desc: "Unlawful Activities (Prevention) Act",
  },
  { id: "pmla", name: "PMLA 2002", desc: "Prevention of Money Laundering Act" },
];

export const DynamicIslandNav: React.FC<DynamicIslandNavProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onPinChat,
  user,
  onLogout,
  onSelectStatute,
  onOpenButtonSystemSheet,
  forcedState = null,
  activeMode = "justice-compass",
  onModeChange,
}) => {
  // Dropdown is closed by default, opens only on arrow button click
  const [isOpen, setIsOpen] = useState(false);
  const [isHoveredProject, setIsHoveredProject] = useState(false);
  const [isHoveredCompass, setIsHoveredCompass] = useState(false);
  const [subView, setSubView] = useState<
    "menu" | "history" | "acts" | "profile" | null
  >("menu");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveExpanded =
    forcedState === "expanded" ? true : forcedState === "idle" ? false : isOpen;
  const effectiveHoverProject =
    forcedState === "hover" ? true : isHoveredProject;
  const effectiveHoverCompass =
    forcedState === "hover" ? true : isHoveredCompass;

  const isCompassActive = activeMode === "justice-compass";

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (!forcedState) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [forcedState]);

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      ref={containerRef}
      className="fixed top-5 left-5 sm:left-7 z-50 flex items-start gap-2.5">
      {/* ===================================================
          COLUMN 1: PROJECT ACCESS PILL & DROPDOWN
          (Exact 8 items & subviews preserved without changes)
          =================================================== */}
      <div className="relative flex flex-col items-start">
        {/* Project Access Pill */}
        <motion.div
          onMouseEnter={() => setIsHoveredProject(true)}
          onMouseLeave={() => setIsHoveredProject(false)}
          whileHover={{ y: -2.5, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative h-10 pl-3.5 pr-2 rounded-full flex items-center gap-1.5 select-none cursor-pointer transition-colors duration-200 ${
            !isCompassActive
              ? "bg-[#0E171B]/90 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-white"
              : "bg-[#0C1318]/75 hover:bg-[#111A20]/90 border border-white/10 hover:border-emerald-500/40 shadow-[0_4px_16px_rgba(0,0,0,0.4)] text-zinc-300 hover:text-white"
          } backdrop-blur-2xl text-xs sm:text-[13px] font-medium`}>
          {/* Green Boundary Moving Outward Hover Effect */}
          {effectiveHoverProject && (
            <>
              <div className="green-boundary-ripple pointer-events-none" />
              <div className="green-boundary-ripple-secondary pointer-events-none" />
              <div className="green-boundary-ripple-tertiary pointer-events-none" />
            </>
          )}
          {/* Main button: switches mode without opening dropdown */}
          <button
            type="button"
            onClick={() => {
              onModeChange?.("project-access");
              setIsOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer text-left py-1 pr-1 active:scale-95 transition-transform">
            <div className="flex items-center justify-center text-emerald-400">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="tracking-tight text-white">Project Access</span>
          </button>

          {/* Dedicated Arrow Button: ONLY this button opens/closes dropdown */}
          <button
            type="button"
            title={
              !isCompassActive && effectiveExpanded
                ? "Close Project Access menu"
                : "Open Project Access menu"
            }
            onClick={(e) => {
              e.stopPropagation();
              if (isCompassActive) {
                onModeChange?.("project-access");
                setIsOpen(true);
                setSubView("menu");
              } else {
                setIsOpen((prev) => !prev);
                setSubView("menu");
              }
            }}
            className="p-1 rounded-full hover:bg-white/15 active:scale-90 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center">
            {!isCompassActive ? (
              effectiveExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )
            ) : (
              <ArrowRight className="w-3 h-3 text-zinc-400 hover:text-white" />
            )}
          </button>
        </motion.div>

        {/* Project Access Dropdown Stack */}
        <AnimatePresence>
          {!isCompassActive && effectiveExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 28,
              }}
              className="absolute top-full left-0 mt-2.5 w-[220px] sm:w-[240px] flex flex-col gap-1.5 z-50 text-[#F5F5F0]">
              {subView === "menu" ? (
                <>
                  {/* 1. New Chat */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onNewChat();
                      setIsOpen(false);
                    }}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left">
                    <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="font-medium">New Chat</span>
                  </motion.button>

                  {/* 2. Chat History */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSubView("history")}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left group">
                    <div className="flex items-center gap-3 min-w-0">
                      <History className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="font-medium truncate">Chat History</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-white/5">
                      {chats.length}
                    </span>
                  </motion.button>

                  {/* 3. Legal Categories & Acts */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSubView("acts")}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left group">
                    <div className="flex items-center gap-3 min-w-0">
                      <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span className="font-medium truncate">
                        Legal Categories &amp; Acts
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                  </motion.button>

                  {/* 4. Saved Provisions */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      alert(
                        "Saved Provisions: View your pinned and bookmarked statutory sections.",
                      );
                    }}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left">
                    <Bookmark className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="font-medium">Saved Provisions</span>
                  </motion.button>

                  {/* 5. Search */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const q = prompt(
                        "Quick Statutory Section Search (e.g., Section 438 BNSS):",
                      );
                      if (q && q.trim()) {
                        onSelectStatute?.(q.trim());
                        setIsOpen(false);
                      }
                    }}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left">
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="font-medium">Search</span>
                  </motion.button>

                  {/* 6. Settings */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      alert(
                        "Settings: Preferences, Model Parameters, and System Options.",
                      );
                    }}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left">
                    <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="font-medium">Settings</span>
                  </motion.button>

                  {/* 7. Profile & Account */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSubView("profile")}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#0D151B]/85 border border-white/10 hover:border-white/20 backdrop-blur-2xl shadow-[0_6px_20px_rgba(0,0,0,0.5)] transition-all text-left">
                    <User className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="font-medium truncate">
                      {user?.name || "Profile & Account"}
                    </span>
                  </motion.button>

                  {/* 8. Upgrade Plan (Green Tinted Accent from Figma) */}
                  <motion.button
                    type="button"
                    whileHover={{ x: 4, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      alert(
                        "Project Access Pro: Institutional access active with full statutory indexing and precedent analysis.",
                      );
                    }}
                    className="btn-glass px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-emerald-300 font-medium bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/35 hover:border-emerald-500/55 backdrop-blur-2xl shadow-[0_6px_24px_rgba(16,185,129,0.2)] transition-all text-left">
                    <Star className="w-4 h-4 text-emerald-400 fill-emerald-400/30 shrink-0" />
                    <span>Upgrade Plan</span>
                  </motion.button>
                </>
              ) : subView === "history" ? (
                /* Chat History Expanded View */
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-2xl bg-[#0D151B]/95 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-2 w-[280px]">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2 font-medium text-white">
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chat History</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubView("menu")}
                      className="text-zinc-400 hover:text-white text-[11px] hover:underline">
                      Back
                    </button>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                    {chats.length === 0 ? (
                      <div className="py-4 text-center text-xs text-zinc-500">
                        No chats yet.
                      </div>
                    ) : (
                      chats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => {
                            onSelectChat(chat.id);
                            setIsOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                            chat.id === activeChatId
                              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30"
                              : "hover:bg-white/5 text-zinc-300 hover:text-white"
                          }`}>
                          <span className="truncate pr-2">{chat.title}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => onPinChat(chat.id, e)}
                              className="p-1 text-zinc-500 hover:text-emerald-400">
                              <Pin
                                className={`w-3 h-3 ${chat.pinned ? "fill-current text-emerald-400" : ""}`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => onDeleteChat(chat.id, e)}
                              className="p-1 text-zinc-500 hover:text-rose-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : subView === "acts" ? (
                /* Acts Browser Subview */
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-2xl bg-[#0D151B]/95 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-2 w-[280px]">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                    <div className="flex items-center gap-2 font-medium text-white">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Statutory Frameworks</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubView("menu")}
                      className="text-zinc-400 hover:text-white text-[11px] hover:underline">
                      Back
                    </button>
                  </div>

                  <div className="max-h-[240px] overflow-y-auto space-y-1.5 pr-1">
                    {STATUTE_CATEGORIES.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          onSelectStatute?.(act.name);
                          setIsOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-white/[0.03] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 transition-all text-xs group">
                        <div className="font-medium text-white group-hover:text-emerald-300">
                          {act.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {act.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : subView === "profile" ? (
                /* Profile Subview */
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3.5 rounded-2xl bg-[#0D151B]/95 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-2.5 w-[260px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-semibold uppercase text-[10px]">
                      Account
                    </span>
                    <button
                      type="button"
                      onClick={() => setSubView("menu")}
                      className="text-zinc-400 hover:text-white text-[11px] hover:underline">
                      Back
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300">
                      {user?.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {user?.name || "Practitioner"}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">
                        {user?.email || "advocate@projectaccess.in"}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-semibold">
                      Pro Active
                    </span>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="btn-glass px-2.5 py-1 rounded-lg text-xs text-rose-400 hover:bg-rose-500/20 flex items-center gap-1.5">
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================
          COLUMN 2: JUSTICE COMPASS PILL & DROPDOWN
          (Exact 5 capsule items matching Figma screenshot)
          =================================================== */}
      <div className="relative flex flex-col items-start">
        {/* Justice Compass Pill */}
        <motion.div
          onMouseEnter={() => setIsHoveredCompass(true)}
          onMouseLeave={() => setIsHoveredCompass(false)}
          whileHover={{ y: -2.5, scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative h-10 pl-3.5 pr-2 rounded-full flex items-center gap-1.5 select-none cursor-pointer transition-colors duration-200 ${
            isCompassActive
              ? "bg-[#0E171B]/90 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-emerald-300"
              : "bg-[#0B1516]/75 hover:bg-[#0E1A1C]/90 border border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.4)] text-emerald-400/80 hover:text-emerald-300"
          } backdrop-blur-2xl text-xs sm:text-[13px] font-medium`}>
          {/* Green Boundary Moving Outward Hover Effect */}
          {effectiveHoverCompass && (
            <>
              <div className="green-boundary-ripple pointer-events-none" />
              <div className="green-boundary-ripple-secondary pointer-events-none" />
              <div className="green-boundary-ripple-tertiary pointer-events-none" />
            </>
          )}
          {/* Main button: switches mode without opening dropdown */}
          <button
            type="button"
            onClick={() => {
              onModeChange?.("justice-compass");
              setIsOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer text-left py-1 pr-1 active:scale-95 transition-transform">
            <div className="w-4 h-4 rounded-full border border-emerald-400/80 flex items-center justify-center shrink-0">
              <Compass className="w-2.5 h-2.5 text-emerald-400" />
            </div>
            <span className="text-white font-medium">Justice Compass</span>
          </button>

          {/* Dedicated Arrow Button: ONLY this button opens/closes dropdown */}
          <button
            type="button"
            title={
              isCompassActive && effectiveExpanded
                ? "Close Justice Compass menu"
                : "Open Justice Compass menu"
            }
            onClick={(e) => {
              e.stopPropagation();
              if (!isCompassActive) {
                onModeChange?.("justice-compass");
                setIsOpen(true);
              } else {
                setIsOpen((prev) => !prev);
              }
            }}
            className="p-1 rounded-full hover:bg-white/15 active:scale-90 text-emerald-400 hover:text-white transition-all cursor-pointer flex items-center justify-center">
            {isCompassActive ? (
              effectiveExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              )
            ) : (
              <ArrowRight className="w-3 h-3 text-emerald-400/80 hover:text-emerald-300" />
            )}
          </button>
        </motion.div>

        {/* Justice Compass Dropdown Stack (Exact 5 items from Figma) */}
        <AnimatePresence>
          {isCompassActive && effectiveExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 28,
              }}
              className="absolute top-full left-0 mt-2.5 w-[210px] sm:w-[230px] flex flex-col gap-2 z-50 text-[#F5F5F0]">
              {/* 1. Know Your Rights */}
              <motion.button
                type="button"
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectStatute?.(
                    "What are my fundamental legal and procedural rights under Indian criminal law (BNS/BNSS)?",
                  );
                  setIsOpen(false);
                }}
                className="group w-full h-[46px] px-3.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#111D23]/80 hover:bg-[#162730]/95 border border-white/10 hover:border-emerald-500/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all text-left cursor-pointer select-none">
                <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 flex items-center justify-center shrink-0 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-300 transition-colors" />
                </div>
                <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Know Your Rights
                </span>
              </motion.button>

              {/* 2. Nearest Legal Aid */}
              <motion.button
                type="button"
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectStatute?.(
                    "How do I find and contact my nearest Legal Aid Clinic or District Legal Services Authority (DLSA)?",
                  );
                  setIsOpen(false);
                }}
                className="group w-full h-[46px] px-3.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#111D23]/80 hover:bg-[#162730]/95 border border-white/10 hover:border-emerald-500/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all text-left cursor-pointer select-none">
                <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 flex items-center justify-center shrink-0 transition-colors">
                  <Search className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-300 transition-colors" />
                </div>
                <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Nearest Legal Aid
                </span>
              </motion.button>

              {/* 3. Court & DLSA Locator */}
              <motion.button
                type="button"
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectStatute?.(
                    "Which district court or DLSA handles civil and criminal jurisdiction in my locality?",
                  );
                  setIsOpen(false);
                }}
                className="group w-full h-[46px] px-3.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#111D23]/80 hover:bg-[#162730]/95 border border-white/10 hover:border-emerald-500/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all text-left cursor-pointer select-none">
                <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 flex items-center justify-center shrink-0 transition-colors">
                  <Bookmark className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-300 transition-colors" />
                </div>
                <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Court &amp; DLSA Locator
                </span>
              </motion.button>

              {/* 4. Guided Complaint */}
              <motion.button
                type="button"
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectStatute?.(
                    "Guide me step-by-step through drafting and filing a formal legal complaint or FIR under the BNSS framework.",
                  );
                  setIsOpen(false);
                }}
                className="group w-full h-[46px] px-3.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#111D23]/80 hover:bg-[#162730]/95 border border-white/10 hover:border-emerald-500/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all text-left cursor-pointer select-none">
                <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 flex items-center justify-center shrink-0 transition-colors">
                  <Send className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-300 transition-colors" />
                </div>
                <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Guided Complaint
                </span>
              </motion.button>

              {/* 5. Emergency Contacts */}
              <motion.button
                type="button"
                whileHover={{ x: 4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSelectStatute?.(
                    "What are the official national emergency helplines (112, 181, 1098, NALSA 15100) and statutory emergency contacts?",
                  );
                  setIsOpen(false);
                }}
                className="group w-full h-[46px] px-3.5 rounded-2xl flex items-center gap-3 text-xs sm:text-[13px] text-zinc-200 hover:text-white bg-[#111D23]/80 hover:bg-[#162730]/95 border border-white/10 hover:border-emerald-500/40 backdrop-blur-2xl shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.12)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all text-left cursor-pointer select-none">
                <div className="w-7 h-7 rounded-xl bg-white/[0.08] border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/15 flex items-center justify-center shrink-0 transition-colors">
                  <User className="w-3.5 h-3.5 text-zinc-300 group-hover:text-emerald-300 transition-colors" />
                </div>
                <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                  Emergency Contacts
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
