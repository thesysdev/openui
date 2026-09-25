import { DocsShell } from "@/components/docs-shell";

export default function Layout({ children }: LayoutProps<"/cookbooks">) {
  return <DocsShell>{children}</DocsShell>;
}
