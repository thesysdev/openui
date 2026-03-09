"use client";

import { DocsNavbar } from "@/components/docs-navbar";
import { baseOptions, siteConfig } from "@/lib/layout.shared";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function SidebarBannerLink({
  href,
  label,
  icon,
  external = false,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="relative flex flex-row items-center gap-3 rounded-lg p-2 text-sm text-fd-foreground no-underline hover:bg-fd-accent transition-colors"
    >
      <span className="flex items-center justify-center size-8 rounded-lg bg-fd-muted text-fd-muted-foreground shrink-0 [&_svg]:size-4 [&_svg]:shrink-0">
        {icon}
      </span>
      {label}
    </Link>
  );
}

type DocsRouteLayoutProps = {
  tree: React.ComponentProps<typeof DocsLayout>["tree"];
  children: ReactNode;
};

export function DocsRouteLayout({ tree, children }: DocsRouteLayoutProps) {
  const pathname = usePathname();
  const isIntroductionRoute =
    pathname === "/docs/introduction" || pathname.startsWith("/docs/introduction/");

  return (
    <DocsLayout
      tree={tree}
      {...baseOptions()}
      nav={{ component: <DocsNavbar showSidebarToggle={!isIntroductionRoute} /> }}
      sidebar={{
        tabs: false,
        enabled: !isIntroductionRoute,
        collapsible: false,
        banner: (
          <div className="flex flex-col mb-2">
            <SidebarBannerLink
              href="/playground"
              label="Playground"
              external
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              }
            />
            <SidebarBannerLink
              href="/docs/mcp"
              label="Docs MCP Server"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              }
            />
            <SidebarBannerLink
              href={siteConfig.discordUrl}
              label="Discord"
              external
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              }
            />
          </div>
        ),
      }}
      searchToggle={{ enabled: false }}
      themeSwitch={{ enabled: false }}
    >
      {children}
    </DocsLayout>
  );
}
