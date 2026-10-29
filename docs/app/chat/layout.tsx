import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { areDemosDisabled } from "@/lib/demo-credits";
import type { ReactNode } from "react";
import { ChatPageClient } from "./_components/chat-page-client";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <ChatPageClient />
      {areDemosDisabled() && <DemosOfflineDialog />}
      {children}
    </WebsiteThemeProvider>
  );
}
