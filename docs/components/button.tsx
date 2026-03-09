import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface ButtonProps {
  href: string;
  text: string;
  size?: "lg";
  variant?: "primary" | "secondary";
}

export function Button({ href, text, size = "lg", variant = "primary" }: ButtonProps) {
  const sizeClasses = size === "lg" ? "px-6 py-3 text-base font-medium" : "";

  const variantClasses =
    variant === "primary"
      ? "text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
      : "text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors dark:bg-[var(--color-doc-surface)] dark:text-slate-300 dark:border-[var(--color-doc-border)] dark:hover:bg-[var(--color-doc-surface-raised)]";

  return (
    <Link
      href={href}
      className={`inline-flex items-center no-underline ${sizeClasses} ${variantClasses}`}
    >
      {text}
      {variant === "primary" && <ArrowRight className="ml-2 h-4 w-4" />}
    </Link>
  );
}
