"use client";

import { genuiOutput } from "@/components/overview-components/genui";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui";

/* The docs shell uses the lightweight theme provider, which openuiLibrary's
   components cannot see, so the preview brings the full one. */
export function LangExamplePreview() {
  return (
    <WebsiteThemeProvider>
      <Renderer library={openuiLibrary} response={genuiOutput} isStreaming={false} />
    </WebsiteThemeProvider>
  );
}
