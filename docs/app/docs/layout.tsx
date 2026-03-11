import { DocsRouteLayout } from "@/components/docs-route-layout";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return <DocsRouteLayout tree={source.getPageTree()}>{children}</DocsRouteLayout>;
}
