"use client";

import { ThemeProvider } from "@openuidev/react-ui";
import type { ReactNode } from "react";

const FONT_FAMILY = 'var(--font-inter), "Inter", "Segoe UI", Arial, sans-serif';

const fontOverrides = {
  fontBody: FONT_FAMILY,
  fontHeading: FONT_FAMILY,
  fontLabel: FONT_FAMILY,
  fontNumbers: FONT_FAMILY,
};

interface AppThemeProviderProps {
  children: ReactNode;
}

export default function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider mode="light" theme={fontOverrides}>
      {children}
    </ThemeProvider>
  );
}
