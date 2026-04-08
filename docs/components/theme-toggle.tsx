"use client";

import { cn } from "@/lib/cn";
import { useTheme } from "next-themes";
import styles from "./theme-toggle.module.css";

type ThemeToggleProps = {
  className?: string;
  onToggle?: () => void;
  title?: string;
  ariaLabel?: string;
};

function ThemeToggleIcon() {
  return (
    <svg
      className={styles.icon}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96452 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM3.75 12C3.75249 9.81273 4.62248 7.71575 6.16911 6.16911C7.71575 4.62247 9.81273 3.75248 12 3.75V20.25C9.81273 20.2475 7.71575 19.3775 6.16911 17.8309C4.62248 16.2843 3.75249 14.1873 3.75 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ThemeToggle({ className, onToggle, title, ariaLabel }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const defaultLabel = `Switch to ${nextTheme} mode`;

  return (
    <button
      type="button"
      className={cn(styles.button, className)}
      aria-label={ariaLabel ?? defaultLabel}
      title={title ?? ariaLabel ?? defaultLabel}
      onClick={onToggle ?? (() => setTheme(nextTheme))}
      data-theme-toggle=""
    >
      <ThemeToggleIcon />
    </button>
  );
}
