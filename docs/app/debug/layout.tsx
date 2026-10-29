import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { createPageMetadata } from "@/lib/page-metadata";
import "@openuidev/thesys/styles.css";
import type { ReactNode } from "react";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function DebugLayout({ children }: { children: ReactNode }) {
  return <WebsiteThemeProvider>{children}</WebsiteThemeProvider>;
}
