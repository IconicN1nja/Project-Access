'use client';

import React from 'react';

interface ClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ClearModal: React.FC<ClearModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xs rounded-xl p-5 relative shadow-xl text-center">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">Clear chat?</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          This will delete all messages in this conversation.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-1.5 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
