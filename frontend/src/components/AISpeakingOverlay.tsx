"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Square, Volume2, Sparkles } from "lucide-react";
import { getSavedVoiceSettings, saveVoiceSettings } from "@/lib/voiceHelper";

interface AISpeakingOverlayProps {
  isOpen: boolean;
  text: string;
  spokenCharIndex: number;
  onStop: () => void;
}

export const AISpeakingOverlay: React.FC<AISpeakingOverlayProps> = ({
  isOpen,
  text,
  spokenCharIndex,
  onStop,
}) => {
  const [systemVoices, setSystemVoices] = React.useState<
    SpeechSynthesisVoice[]
  >([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = React.useState<string>("");

  React.useEffect(() => {
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
    const settings = getSavedVoiceSettings();
    saveVoiceSettings({ ...settings, voiceURI: uri });
  };

  // Strip markdown formatting symbols for display
  const cleanText = text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*+/g, "")
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  // Calculate split index
  const activeIndex = Math.min(Math.max(0, spokenCharIndex), cleanText.length);
  const spokenPart = cleanText.substring(0, activeIndex);
  const unspokenPart = cleanText.substring(activeIndex);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 bg-[#060A0E]/80 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden">
          {/* Top Status Header & Voice Selector */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 flex-wrap justify-center">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Sparkles
                className="w-4 h-4 text-emerald-400 animate-spin"
                style={{ animationDuration: "6s" }}
              />
              <span>Project Access AI Speaking</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>

            {/* Voice Dropdown Selector */}
            {systemVoices.length > 0 && (
              <div className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0E171D]/90 border border-white/10 text-xs text-zinc-300 backdrop-blur-md shadow-lg">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={selectedVoiceURI}
                  onChange={handleVoiceChange}
                  className="bg-transparent text-zinc-200 text-xs border-0 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-[280px] truncate font-medium">
                  {systemVoices.map((v) => (
                    <option
                      key={v.voiceURI}
                      value={v.voiceURI}
                      className="bg-[#0E171D] text-white">
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>

          {/* Center Graphic: Pulsing AI Audio Orb & Waveforms */}
          <div className="relative my-auto flex flex-col items-center justify-center">
            {/* Outer Expanding Waves */}
            <div
              className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-ping pointer-events-none"
              style={{ animationDuration: "3s" }}
            />
            <div className="absolute w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-teal-500/15 border border-teal-500/30 pointer-events-none blur-sm" />

            {/* Main Glowing AI Sphere */}
            <motion.div
              animate={{
                scale: [1, 1.08, 0.98, 1.05, 1],
                boxShadow: [
                  "0 0 40px rgba(16,185,129,0.4), inset 0 0 25px rgba(255,255,255,0.6)",
                  "0 0 80px rgba(16,185,129,0.7), inset 0 0 35px rgba(255,255,255,0.8)",
                  "0 0 40px rgba(16,185,129,0.4), inset 0 0 25px rgba(255,255,255,0.6)",
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
              }}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-1 flex items-center justify-center relative shadow-[0_0_60px_rgba(16,185,129,0.5)] cursor-pointer">
              <div className="w-full h-full rounded-full bg-[#081216]/90 backdrop-blur-md flex items-center justify-center relative overflow-hidden">
                {/* Audio Wave Soundbars */}
                <div className="flex items-center gap-1.5">
                  {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.3].map((val, idx) => (
                    <motion.span
                      key={idx}
                      animate={{ height: ["8px", `${36 * val}px`, "8px"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8 + (idx % 3) * 0.2,
                        ease: "easeInOut",
                      }}
                      className="w-1.5 rounded-full bg-gradient-to-t from-emerald-400 to-teal-200 shadow-[0_0_8px_#34d399]"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Interactive Spoken Text Box with Smooth Grey-to-White Karaoke Effect */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 sm:mt-10 max-w-2xl mx-auto px-6 py-5 rounded-3xl bg-[#0C151B]/85 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] text-center">
              <p className="text-base sm:text-lg md:text-xl font-sans leading-relaxed tracking-normal font-normal">
                {/* Spoken Part: Bright White */}
                <span className="text-white font-medium drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)] transition-colors duration-200">
                  {spokenPart}
                </span>

                {/* Unspoken Part: Dimmed Subtle Grey */}
                <span className="text-zinc-500/60 transition-colors duration-200">
                  {unspokenPart}
                </span>
              </p>
            </motion.div>
          </div>

          {/* Bottom Stop Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-2">
            <button
              type="button"
              onClick={onStop}
              className="btn-glass px-6 py-2.5 rounded-full flex items-center gap-2.5 text-xs sm:text-sm font-medium text-rose-300 hover:text-white border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 hover:bg-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.2)] transition-all cursor-pointer">
              <Square className="w-4 h-4 fill-current text-rose-400" />
              <span>Stop AI Speaking</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
