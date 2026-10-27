"use client";

import { ThemeProvider } from "@openuidev/react-ui";
// Component styles for the pages that render @openuidev/react-ui components.
// app/global.css only carries the design tokens.
import "@openuidev/react-ui/styles/index.css";
import { WebsiteThemeBridge, type WebsiteThemeProviderProps } from "./website-theme-bridge";

export function WebsiteThemeProvider({ children, forcedTheme }: WebsiteThemeProviderProps) {
  return (
    <WebsiteThemeBridge provider={ThemeProvider} forcedTheme={forcedTheme}>
      {children}
    </WebsiteThemeBridge>
  );
}
