"use client";

import type { ThemeMode } from "@design-system/types";
import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";

  const storedTheme = window.localStorage.getItem("openui-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("openui-theme", theme);
  }, [theme]);

  return (
    <div className={styles.themeToggle} role="group" aria-label="Theme mode">
      <button
        type="button"
        className={`${styles.themeToggleButton}${theme === "light" ? ` ${styles.themeToggleButtonActive}` : ""}`}
        onClick={() => setTheme("light")}
      >
        Light
      </button>
      <button
        type="button"
        className={`${styles.themeToggleButton}${theme === "dark" ? ` ${styles.themeToggleButtonActive}` : ""}`}
        onClick={() => setTheme("dark")}
      >
        Dark
      </button>
    </div>
  );
}
