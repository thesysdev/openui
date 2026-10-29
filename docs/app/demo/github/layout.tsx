import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { areDemosDisabled } from "@/lib/demo-credits";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import "./layout.css";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function DemoGitHubLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      {children}
      {areDemosDisabled() && <DemosOfflineDialog />}
    </WebsiteThemeProvider>
  );
}
