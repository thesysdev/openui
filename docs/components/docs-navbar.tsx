"use client";

import { siteConfig } from "@/lib/layout.shared";
import { SidebarTrigger } from "fumadocs-ui/components/sidebar/base";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OpenUILogo } from "./brand-logo";

const tabs = [
  { title: "Introduction", url: "/docs/introduction" },
  { title: "OpenUI Lang", url: "/docs/openui-lang" },
  { title: "Chat", url: "/docs/chat" },
  { title: "API Reference", url: "/docs/api-reference" },
];

function SearchBar() {
  const { setOpenSearch } = useSearchContext();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpenSearch(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setOpenSearch]);

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      aria-label="Search documentation"
      className="flex items-center gap-2.5 h-9 pl-3.5 pr-2.5 rounded-lg border border-fd-border bg-fd-background text-fd-muted-foreground cursor-pointer w-64 hover:border-fd-ring transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span className="text-sm flex-1 text-left">Search...</span>
      <kbd className="hidden sm:flex items-center gap-0.5 text-[11px] font-medium text-fd-muted-foreground border border-fd-border rounded px-1.5 py-0.5 leading-none">
        {isMac ? "⌘" : "Ctrl"}
        <span>K</span>
      </kbd>
    </button>
  );
}

export function DocsNavbar({ showSidebarToggle = false }: { showSidebarToggle?: boolean }) {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-40 w-full border-b border-fd-border bg-fd-background/80 backdrop-blur-xl">
      {/* Top row: logo left, actions right */}
      <div className="flex items-center h-16 max-w-[97rem] mx-auto px-8">
        {showSidebarToggle && (
          <SidebarTrigger className="docs-nav-sidebar-toggle flex items-center justify-center size-9 rounded-lg text-fd-muted-foreground bg-transparent border-none cursor-pointer mr-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </SidebarTrigger>
        )}

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <OpenUILogo />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <SearchBar />
          <div className="flex items-center gap-0.5">
            {/* Discord */}
            <Link
              href={siteConfig.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center size-9 rounded-lg text-fd-muted-foreground no-underline hover:text-fd-foreground hover:bg-fd-accent transition-colors"
              aria-label="Discord"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </Link>
            {/* GitHub */}
            <Link
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center size-9 rounded-lg text-fd-muted-foreground no-underline hover:text-fd-foreground hover:bg-fd-accent transition-colors"
              aria-label="GitHub"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom row: tabs */}
      <div className="max-w-[97rem] mx-auto px-8">
        <nav className="docs-nav-tabs flex items-center overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.url);
            return (
              <Link
                key={tab.url}
                href={tab.url}
                className={`flex items-center px-4 py-2.5 text-sm font-medium whitespace-nowrap no-underline transition-colors duration-150 border-b-2 -mb-px ${
                  isActive
                    ? "text-fd-foreground border-fd-primary"
                    : "text-fd-muted-foreground border-transparent hover:text-fd-foreground"
                }`}
              >
                {tab.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
