import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import "@openuidev/thesys/styles.css";
import type { ReactNode } from "react";
import { ChatPageClient } from "./_components/chat-page-client";

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <ChatPageClient />
      {children}
    </WebsiteThemeProvider>
  );
}
