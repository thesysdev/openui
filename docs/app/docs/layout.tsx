import { DocsShell } from "@/components/docs-shell";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return <DocsShell>{children}</DocsShell>;
}
