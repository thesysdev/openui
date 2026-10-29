import { DemosOfflineDialog } from "@/components/DemosOfflineDialog";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { DEMOS_DISABLED } from "@/lib/demos-offline";
import type { ReactNode } from "react";
import { ChatPageClient } from "./_components/chat-page-client";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <ChatPageClient />
      {DEMOS_DISABLED && <DemosOfflineDialog />}
      {children}
    </WebsiteThemeProvider>
  );
}
