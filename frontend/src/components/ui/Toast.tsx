"use client";

import React from "react";

interface ToastProps {
  message: string;
  type?: "info" | "error";
}

export const Toast: React.FC<ToastProps> = ({ message, type = "info" }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-tooltip)] flex flex-col gap-1.5 pointer-events-none">
      <div className="toast-enter flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-900/90 backdrop-blur-xl text-emerald-400 shadow-[0_4px_14px_rgba(0,0,0,0.5)] border border-emerald-500/30">
        {type === "error" && <span className="text-rose-400">⚠</span>}
        <span>{message}</span>
      </div>
    </div>
  );
};
