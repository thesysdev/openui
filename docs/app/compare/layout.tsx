import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { areDemosDisabled } from "@/lib/demo-credits";
import type { ReactNode } from "react";

export default function CompareLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      {children}
      {areDemosDisabled() && <DemosOfflineDialog />}
    </WebsiteThemeProvider>
  );
}
