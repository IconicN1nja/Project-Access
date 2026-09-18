"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowUp,
  Paperclip,
  Mic,
  Scale,
  Sparkles,
  Layers,
  X,
  ChevronDown,
  Info,
  CheckCircle2,
} from "lucide-react";

interface ButtonSystemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSetForcedIslandState: (state: "idle" | "hover" | "expanded" | null) => void;
  forcedIslandState: "idle" | "hover" | "expanded" | null;
  onSetInputFocusDemo?: (focused: boolean) => void;
}

export const ButtonSystemSheet: React.FC<ButtonSystemSheetProps> = ({
  isOpen,
  onClose,
  onSetForcedIslandState,
  forcedIslandState,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0D0D10] border border-white/10 p-6 sm:p-8 text-[#F5F5F0] shadow-2xl shadow-black/80"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-serif text-white font-medium">
                Button System & Component States
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/30">
                Figma Spec
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              MacBook Air 13&quot; M4 Specification • Glassmorphism, Floating Elevation, and Tactile Micro-Interactions
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deliverables / States Quick Switcher */}
        <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Interactive Dynamic Island States Preview</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onSetForcedIslandState(null)}
              className={`btn-glass px-3 py-1.5 rounded-full text-xs ${
                forcedIslandState === null ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/15" : "text-zinc-300"
              }`}
            >
              Interactive Mode (Auto)
            </button>
            <button
              type="button"
              onClick={() => onSetForcedIslandState("idle")}
              className={`btn-glass px-3 py-1.5 rounded-full text-xs ${
                forcedIslandState === "idle" ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/15" : "text-zinc-300"
              }`}
            >
              1. Dynamic Island — Idle State
            </button>
            <button
              type="button"
              onClick={() => onSetForcedIslandState("hover")}
              className={`btn-glass px-3 py-1.5 rounded-full text-xs ${
                forcedIslandState === "hover" ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/15" : "text-zinc-300"
              }`}
            >
              2. Dynamic Island — Hover (Water-drop ripple)
            </button>
            <button
              type="button"
              onClick={() => onSetForcedIslandState("expanded")}
              className={`btn-glass px-3 py-1.5 rounded-full text-xs ${
                forcedIslandState === "expanded" ? "border-[#7C3AED] text-[#C4B5FD] bg-[#7C3AED]/15" : "text-zinc-300"
              }`}
            >
              3. Dynamic Island — Expanded (All Nav Items Revealed)
            </button>
          </div>
        </div>

        {/* Button System Sheet Matrix */}
        <div className="mt-8 space-y-8">
          {/* Section 1: Button System Architecture */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 mb-3">
              1. Floating Micro-Interaction Matrix (Default × Hover × Pressed)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400">
                    <th className="py-2.5 px-3">Button Type</th>
                    <th className="py-2.5 px-3">Default State</th>
                    <th className="py-2.5 px-3">Hover State (Lifts 2-3px)</th>
                    <th className="py-2.5 px-3">Active / Pressed (Scale 0.97)</th>
                    <th className="py-2.5 px-3">Special State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Send Button */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-white">
                      Send Button
                      <div className="text-[10px] text-zinc-500 font-normal">Circular, dark-purple glass</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full btn-send-purple flex items-center justify-center text-white">
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full btn-send-purple flex items-center justify-center text-white -translate-y-1 scale-105 shadow-[0_8px_25px_rgba(124,58,237,0.6)]">
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full btn-send-purple flex items-center justify-center text-white scale-95 opacity-90">
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-9 h-9 rounded-full btn-send-purple pulse-purple-glow flex items-center justify-center text-white">
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <span className="text-[9px] text-[#C4B5FD] block mt-1">Pulsing Glow (Ready)</span>
                    </td>
                  </tr>

                  {/* Example Prompt Chips */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-white">
                      Example Prompt Chips
                      <div className="text-[10px] text-zinc-500 font-normal">Soft glass pill buttons</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass btn-glass-pill px-3 py-1.5 inline-flex items-center gap-1.5 text-[11px] text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                        <span>Tenant deposit</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass btn-glass-pill px-3 py-1.5 inline-flex items-center gap-1.5 text-[11px] text-white -translate-y-1 shadow-[0_8px_20px_rgba(124,58,237,0.25)] border-white/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
                        <span>Tenant deposit</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass btn-glass-pill px-3 py-1.5 inline-flex items-center gap-1.5 text-[11px] text-zinc-300 scale-95 opacity-80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                        <span>Tenant deposit</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[10px]">
                      Haptic spring rebound
                    </td>
                  </tr>

                  {/* Model / Statute Selector */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-white">
                      Statute Selector
                      <div className="text-[10px] text-zinc-500 font-normal">Scope filter pill</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass px-2.5 py-1.5 rounded-full inline-flex items-center gap-1.5 text-[11px] text-zinc-300">
                        <Scale className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>All Statutes</span>
                        <ChevronDown className="w-3 h-3 text-zinc-500" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass px-2.5 py-1.5 rounded-full inline-flex items-center gap-1.5 text-[11px] text-white -translate-y-0.5 border-white/20">
                        <Scale className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>All Statutes</span>
                        <ChevronDown className="w-3 h-3 text-zinc-300" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass px-2.5 py-1.5 rounded-full inline-flex items-center gap-1.5 text-[11px] text-zinc-300 scale-95">
                        <Scale className="w-3.5 h-3.5 text-[#7C3AED]" />
                        <span>All Statutes</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[10px]">
                      Dropdown active state
                    </td>
                  </tr>

                  {/* Plus / Attach Button */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-white">
                      Attach Button
                      <div className="text-[10px] text-zinc-500 font-normal">Line icon floating</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-zinc-400">
                        <Paperclip className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-white -translate-y-0.5 border-white/25">
                        <Paperclip className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-zinc-400 scale-95">
                        <Paperclip className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[10px]">
                      Upload document / FIR
                    </td>
                  </tr>

                  {/* Mic / Voice Button */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-white">
                      Voice / Mic Button
                      <div className="text-[10px] text-zinc-500 font-normal">Audio input trigger</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-zinc-400">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-white -translate-y-0.5 border-white/25">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-8 rounded-full btn-glass flex items-center justify-center text-zinc-400 scale-95">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[10px]">
                      Speech recognition
                    </td>
                  </tr>

                  {/* Institutional Plan Badge */}
                  <tr>
                    <td className="py-3 px-3 font-medium text-white">
                      Institutional Plan Badge
                      <div className="text-[10px] text-zinc-500 font-normal">Premium tier indicator</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#C4B5FD] bg-[#7C3AED]/15 border-[#7C3AED]/30">
                        <Sparkles className="w-3 h-3 text-[#A78BFA]" />
                        <span>Pro Access</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 text-[10px] font-semibold text-white bg-[#7C3AED]/30 border-[#7C3AED]/50 -translate-y-0.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span>Pro Access</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="btn-glass px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#C4B5FD] scale-95">
                        <Sparkles className="w-3 h-3 text-[#A78BFA]" />
                        <span>Pro Access</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-500 text-[10px]">
                      Enterprise Verified
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Design Principles Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-medium text-white mb-1">Glassmorphism & Hairline</div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                Translucent dark surfaces (10–15% opacity over blur), 1px border with top specular light-edge.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-medium text-white mb-1">Floating Elevation</div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                Persistent subtle drop shadow. On hover, buttons physically lift 2–3px with spring easing.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="font-medium text-white mb-1">Tactile Haptics</div>
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                On click/tap, tactile scale down (0.96–0.98) with instantaneous spring rebound.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
