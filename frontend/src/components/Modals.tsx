"use client";

import React from "react";

interface ClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearModal: React.FC<ClearModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-[var(--color-border-primary)] w-full max-w-xs rounded-xl p-5 relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] text-center">
        <h3 className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
          Clear chat?
        </h3>
        <p className="text-xs text-[var(--color-text-tertiary)] mb-4">
          This will delete all messages in this conversation.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-[background-color] duration-[var(--transition-fast)] border border-[var(--color-border-primary)]">
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-1.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-medium text-xs transition-[background-color] duration-[var(--transition-fast)] shadow-lg shadow-rose-900/30">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
