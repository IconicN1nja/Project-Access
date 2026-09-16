/**
 * Design System Utility Components
 *
 * Reusable UI primitives that use design tokens for consistency.
 * Import these instead of duplicating styles across components.
 */

// Button variants using design tokens
export const buttonStyles = {
  primary: `
    px-4 py-2.5 rounded-lg font-medium text-sm
    bg-[var(--color-interactive-primary)] text-[var(--color-text-inverted)]
    hover:bg-[var(--color-interactive-primary-hover)]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-[background-color,transform] duration-[var(--transition-base)]
    active:scale-95
    shadow-[var(--shadow-sm)]
  `,
  secondary: `
    px-4 py-2.5 rounded-lg font-medium text-sm
    bg-[var(--color-interactive-secondary)] text-[var(--color-text-primary)]
    border border-[var(--color-border-primary)]
    hover:bg-[var(--color-interactive-secondary-hover)]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-[background-color,border-color] duration-[var(--transition-base)]
  `,
  ghost: `
    px-3 py-1.5 rounded-md font-medium text-sm
    text-[var(--color-text-secondary)]
    hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-[background-color,color] duration-[var(--transition-fast)]
  `,
  icon: `
    p-1.5 rounded-md
    text-[var(--color-text-tertiary)]
    hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]
    transition-[background-color,color] duration-[var(--transition-fast)]
  `,
};

// Input field styles
export const inputStyles = `
  w-full px-3 py-2 text-sm rounded-lg
  bg-transparent
  border border-[var(--color-border-primary)]
  text-[var(--color-text-primary)]
  placeholder:text-[var(--color-text-quaternary)]
  focus:outline-none focus:border-[var(--color-border-focus)]
  transition-[border-color] duration-[var(--transition-fast)]
`;

// Card/Surface styles
export const surfaceStyles = {
  primary: `
    bg-[var(--color-surface-primary)]
    border border-[var(--color-border-primary)]
    rounded-xl
    shadow-[var(--shadow-sm)]
  `,
  secondary: `
    bg-[var(--color-surface-secondary)]
    border border-[var(--color-border-primary)]
    rounded-lg
  `,
  elevated: `
    bg-[var(--color-surface-primary)]
    border border-[var(--color-border-primary)]
    rounded-xl
    shadow-[var(--shadow-md)]
  `,
};

// Text styles
export const textStyles = {
  primary: 'text-[var(--color-text-primary)]',
  secondary: 'text-[var(--color-text-secondary)]',
  tertiary: 'text-[var(--color-text-tertiary)]',
  quaternary: 'text-[var(--color-text-quaternary)]',
  inverted: 'text-[var(--color-text-inverted)]',
};

// Badge/Pill styles
export const badgeStyles = {
  default: `
    inline-flex items-center gap-1.5 px-2.5 py-1
    rounded-full text-xs font-medium
    bg-[var(--color-surface-tertiary)]
    text-[var(--color-text-secondary)]
    border border-[var(--color-border-primary)]
  `,
  accent: `
    inline-flex items-center gap-1.5 px-2.5 py-1
    rounded-full text-xs font-medium
    bg-[var(--color-accent-primary-light)]
    text-[var(--color-accent-primary)]
    border border-[var(--color-accent-primary-border)]
  `,
  success: `
    inline-flex items-center gap-1.5 px-2.5 py-1
    rounded-full text-xs font-medium
    bg-[var(--color-success-bg)]
    text-[var(--color-success)]
    border border-[var(--color-success-border)]
  `,
  error: `
    inline-flex items-center gap-1.5 px-2.5 py-1
    rounded-full text-xs font-medium
    bg-[var(--color-error-bg)]
    text-[var(--color-error)]
    border border-[var(--color-error-border)]
  `,
};

// Dropdown/Menu styles
export const menuStyles = `
  rounded-xl
  bg-[var(--color-surface-primary)]
  border border-[var(--color-border-primary)]
  shadow-[var(--shadow-lg)]
  backdrop-blur-xl
  p-1.5
`;

export const menuItemStyles = `
  w-full flex items-center gap-2.5 px-2.5 py-2
  rounded-lg text-sm text-left
  text-[var(--color-text-secondary)]
  hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]
  transition-[background-color,color] duration-[var(--transition-fast)]
`;

// Modal backdrop
export const modalBackdropStyles = `
  fixed inset-0 z-[var(--z-modal-backdrop)]
  bg-[var(--color-bg-overlay)]
  backdrop-blur-sm
  flex items-center justify-center
  p-4
`;

// Modal content
export const modalContentStyles = `
  bg-[var(--color-surface-primary)]
  border border-[var(--color-border-primary)]
  rounded-xl
  shadow-[var(--shadow-2xl)]
  max-w-md w-full
  p-6
`;

// Toast notification
export const toastStyles = {
  info: `
    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
    bg-[var(--color-interactive-primary)] text-[var(--color-text-inverted)]
    shadow-[var(--shadow-md)]
    border border-[var(--color-border-secondary)]
  `,
  success: `
    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
    bg-[var(--color-success)] text-white
    shadow-[var(--shadow-md)]
  `,
  error: `
    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
    bg-[var(--color-error)] text-white
    shadow-[var(--shadow-md)]
  `,
};
