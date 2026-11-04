import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { DEMOS_DISABLED } from "@/lib/demos-offline";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import "./layout.css";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function DemoGitHubLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      {children}
      {DEMOS_DISABLED && <DemosOfflineDialog />}
    </WebsiteThemeProvider>
  );
}
