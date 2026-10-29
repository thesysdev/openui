import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { DEMOS_DISABLED } from "@/lib/demos-offline";
import type { ReactNode } from "react";

export default function CompareLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      {children}
      {DEMOS_DISABLED && <DemosOfflineDialog />}
    </WebsiteThemeProvider>
  );
}
