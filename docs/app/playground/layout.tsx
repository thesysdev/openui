import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import type { ReactNode } from "react";
import "./layout.css";

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
