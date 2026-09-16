"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  message,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`${sizeClasses[size]} border-3 border-[var(--color-interactive-primary)] border-t-transparent rounded-full animate-spin`}
      />
      {message && (
        <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
          {message}
        </span>
      )}
    </div>
  );
};
