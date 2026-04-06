"use client";

import { ThemeProvider } from "@openuidev/react-ui/ThemeProvider";
import { useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";

const FONT_FAMILY = 'var(--font-inter), "Inter", "Segoe UI", Arial, sans-serif';
const FONT_CODE = 'var(--font-geist-mono), "SFMono-Regular", Menlo, monospace';

const fontOverrides = {
  fontBody: FONT_FAMILY,
  fontCode: FONT_CODE,
  fontHeading: FONT_FAMILY,
  fontLabel: FONT_FAMILY,
  fontNumbers: FONT_FAMILY,
};

type WebsiteThemeProviderProps = {
  children: ReactNode;
  forcedTheme?: "light" | "dark";
};

function WebsiteThemeBridge({
  children,
  forcedTheme,
}: {
  children: ReactNode;
  forcedTheme?: "light" | "dark";
}) {
  const { resolvedTheme } = useTheme();
  const mode = forcedTheme ?? (resolvedTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootTheme = root.getAttribute("data-theme");
    const previousBodyTheme = body.getAttribute("data-theme");
    const previousColorScheme = root.style.colorScheme;

    root.setAttribute("data-theme", mode);
    body.setAttribute("data-theme", mode);
    root.style.colorScheme = mode;

    return () => {
      if (previousRootTheme === null) {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", previousRootTheme);
      }

      if (previousBodyTheme === null) {
        body.removeAttribute("data-theme");
      } else {
        body.setAttribute("data-theme", previousBodyTheme);
      }

      root.style.colorScheme = previousColorScheme;
    };
  }, [mode]);

  return (
    <ThemeProvider mode={mode} lightTheme={fontOverrides}>
      {children}
    </ThemeProvider>
  );
}

export function WebsiteThemeProvider({ children, forcedTheme }: WebsiteThemeProviderProps) {
  return <WebsiteThemeBridge forcedTheme={forcedTheme}>{children}</WebsiteThemeBridge>;
}
