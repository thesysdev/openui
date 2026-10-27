import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import "@openuidev/thesys/styles.css";
import type { ReactNode } from "react";

export default function CompareLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
