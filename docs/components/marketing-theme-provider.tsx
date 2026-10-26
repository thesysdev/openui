"use client";

// The subpath entry is only the provider. The package root would put the whole
// component library (~2 MB of JS) into the first load of every marketing, docs
// and blog page, and into every page that links to them, since Next.js prefetches
// a linked route's JS. The catch is that it has its own React context, so
// @openuidev/react-ui components rendered below it would not see this theme.
// Wrap those in WebsiteThemeProvider, at the page or around just the component.
import { ThemeProvider } from "@openuidev/react-ui/ThemeProvider";
import { WebsiteThemeBridge, type WebsiteThemeProviderProps } from "./website-theme-bridge";

export function MarketingThemeProvider({ children, forcedTheme }: WebsiteThemeProviderProps) {
  return (
    <WebsiteThemeBridge provider={ThemeProvider} forcedTheme={forcedTheme}>
      {children}
    </WebsiteThemeBridge>
  );
}
