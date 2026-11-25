"use client";

import { cn } from "@/lib/cn";
import { useHydrated } from "@/lib/use-hydrated";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import styles from "./theme-toggle.module.css";

type ThemeToggleProps = {
  className?: string;
  onToggle?: () => void;
  title?: string;
  ariaLabel?: string;
};

export function ThemeToggle({ className, onToggle, title, ariaLabel }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useHydrated();
  const isDark = mounted && resolvedTheme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const defaultLabel = `Switch to ${nextTheme} mode`;

  return (
    <button
      type="button"
      className={cn(styles.button, className)}
      aria-label={ariaLabel ?? defaultLabel}
      title={title ?? ariaLabel ?? defaultLabel}
      onClick={onToggle ?? (() => setTheme(nextTheme))}
      data-theme-toggle=""
      data-theme-state={isDark ? "dark" : "light"}
    >
      <span className={styles.iconStack} aria-hidden="true">
        <Sun className={cn(styles.icon, styles.iconSun)} weight="fill" />
        <Moon className={cn(styles.icon, styles.iconMoon)} weight="fill" />
      </span>
    </button>
  );
}
