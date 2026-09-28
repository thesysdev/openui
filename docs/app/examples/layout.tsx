import { DocsShell } from "@/components/docs-shell";

export default function Layout({ children }: LayoutProps<"/examples">) {
  return <DocsShell>{children}</DocsShell>;
}
