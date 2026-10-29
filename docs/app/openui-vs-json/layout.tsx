import "@/app/demos/layout.css";
import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { areDemosDisabled } from "@/lib/demo-credits";
import { createPageMetadata } from "@/lib/page-metadata";
import type { ReactNode } from "react";
import page from "./metadata";

export const metadata = createPageMetadata(page);

export default function DemosLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      {children}
      {areDemosDisabled() && <DemosOfflineDialog />}
    </WebsiteThemeProvider>
  );
}
