import { DocsShell } from "@/components/docs-shell";
export default function Layout({ children }: LayoutProps<"/demos">) {
  return <DocsShell>{children}</DocsShell>;
}
