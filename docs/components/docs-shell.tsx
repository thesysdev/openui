import { C1DocsDialog } from "@/components/C1DocsDialog";
import { DocsRouteLayout } from "@/components/docs-route-layout";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { source } from "@/lib/source";
import type { ReactNode } from "react";

/** The docs chrome (navbar tabs and sidebar) shared by `/docs` and the top-level sections. */
export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <C1DocsDialog />
      <DocsRouteLayout tree={source.getPageTree()}>{children}</DocsRouteLayout>
    </WebsiteThemeProvider>
  );
}
