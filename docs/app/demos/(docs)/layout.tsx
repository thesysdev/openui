import { DocsShell } from "@/components/docs-shell";
import type { ReactNode } from "react";

// A route group, so the live demos under /demos keep their own full-screen layouts.
export default function Layout({ children }: { children: ReactNode }) {
  return <DocsShell>{children}</DocsShell>;
}
