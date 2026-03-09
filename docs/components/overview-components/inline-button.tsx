import type { ReactNode } from "react";

interface InlineButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function InlineButton({
  children,
  variant = "primary",
  className,
  disabled,
  onClick,
}: InlineButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<string, string> = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
    secondary:
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-[var(--color-doc-surface)] dark:text-slate-300 dark:hover:bg-[var(--color-doc-surface-raised)]",
    outline:
      "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-[var(--color-doc-border)] dark:text-slate-300 dark:hover:bg-[var(--color-doc-surface)]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
