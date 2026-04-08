import { DocsRouteLayout } from "@/components/docs-route-layout";
import { WebsiteThemeProvider } from "@/components/website-theme-provider";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <WebsiteThemeProvider>
      <DocsRouteLayout tree={source.getPageTree()}>{children}</DocsRouteLayout>
    </WebsiteThemeProvider>
  );
}
