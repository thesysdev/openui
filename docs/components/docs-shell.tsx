import { C1DocsDialog } from "@/components/C1DocsDialog";
import { DocsRouteLayout } from "@/components/docs-route-layout";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { source } from "@/lib/source";
import type { ReactNode } from "react";

/** Pages with `sidebar: false` in their frontmatter. */
const NO_SIDEBAR_URLS = source
  .getPages()
  .filter((page) => !page.data.sidebar)
  .map((page) => page.url);

/** The docs chrome (navbar tabs and sidebar) shared by `/docs` and the top-level sections. */
export function DocsShell({ children }: { children: ReactNode }) {
  return (
    <WebsiteThemeProvider>
      <C1DocsDialog />
      <DocsRouteLayout tree={source.getPageTree()} noSidebarUrls={NO_SIDEBAR_URLS}>
        {children}
      </DocsRouteLayout>
    </WebsiteThemeProvider>
  );
}
