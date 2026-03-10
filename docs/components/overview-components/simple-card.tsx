import type { ReactNode } from "react";

interface SimpleCardProps {
  children: ReactNode;
  className?: string;
}

export function SimpleCard({ children, className }: SimpleCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white dark:border-[var(--color-doc-border)] dark:bg-[var(--color-doc-surface)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
