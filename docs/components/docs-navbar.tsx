"use client";

import { siteConfig } from "@/lib/layout.shared";
import { SidebarTrigger } from "fumadocs-ui/components/sidebar/base";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { GitHubStarButton, OpenUILogo, ThesysLogo } from "./brand-logo";
import styles from "./docs-navbar.module.css";
import { ThemeToggle } from "./theme-toggle";

const tabs = [
  { title: "OpenUI", url: "/docs/openui-lang" },
  { title: "Chat", url: "/docs/chat" },
  { title: "API Reference", url: "/docs/api-reference" },
];

function SearchBar() {
  const { setOpenSearch } = useSearchContext();
  const [isMac, setIsMac] = useState(
    () => typeof navigator !== "undefined" && /mac/i.test(navigator.userAgent),
  );

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
      className={styles.searchButton}
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
        className={styles.searchIcon}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span className={styles.searchLabel}>Search...</span>
      <kbd className={styles.searchShortcut}>
        {isMac ? "⌘" : "Ctrl"}
        <span>K</span>
      </kbd>
    </button>
  );
}

export function DocsNavbar({ showSidebarToggle = false }: { showSidebarToggle?: boolean }) {
  const pathname = usePathname();
  const [isThesysHovered, setIsThesysHovered] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const tabsRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  useEffect(() => {
    setMounted(true);
  }, []);
  const logoVariant = mounted && resolvedTheme === "dark" ? "dark" : "light";
  const activeTab = tabs.find((tab) => pathname.startsWith(tab.url)) ?? tabs[0];

  const updateIndicator = useCallback(
    (animated: boolean) => {
      const tabsElement = tabsRef.current;
      const indicatorElement = indicatorRef.current;
      const activeTabElement = tabRefs.current[activeTab.url];
      if (!tabsElement || !indicatorElement || !activeTabElement) return;

      const left = activeTabElement.offsetLeft - tabsElement.scrollLeft;
      const width = activeTabElement.offsetWidth;

      indicatorElement.style.transition = animated
        ? "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease"
        : "none";
      indicatorElement.style.width = `${width}px`;
      indicatorElement.style.transform = `translateX(${left}px)`;
      indicatorElement.style.opacity = "1";
    },
    [activeTab.url],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => updateIndicator(true));
    return () => window.cancelAnimationFrame(frame);
  }, [updateIndicator]);

  useEffect(() => {
    const tabsElement = tabsRef.current;
    if (!tabsElement) return;

    const handleScroll = () => updateIndicator(false);
    tabsElement.addEventListener("scroll", handleScroll);

    const resizeObserver = new ResizeObserver(() => updateIndicator(false));
    resizeObserver.observe(tabsElement);

    Object.values(tabRefs.current).forEach((tabElement) => {
      if (tabElement) resizeObserver.observe(tabElement);
    });

    return () => {
      tabsElement.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [updateIndicator]);

  return (
    <header className={styles.header}>
      {/* Top row: logo left, actions right */}
      <div className={styles.topRow}>
        {showSidebarToggle && (
          <SidebarTrigger className={styles.sidebarToggle}>
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
        <div className={styles.brand}>
          <ThesysLogo
            isHovered={isThesysHovered}
            onHoverChange={setIsThesysHovered}
            variant={logoVariant}
          />
          <span className={styles.brandDivider}>|</span>
          <OpenUILogo variant={logoVariant} />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <SearchBar />
          <div className={styles.actionButtons}>
            {/* Discord */}
            <Link
              href={siteConfig.discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconLink}
              aria-label="Discord"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </Link>
            {/* Theme toggle */}
            <ThemeToggle />
            <GitHubStarButton repo="thesysdev/openui" />
          </div>
        </div>
      </div>

      {/* Bottom row: tabs */}
      <div className={styles.tabsContainer}>
        <nav ref={tabsRef} className={styles.tabs}>
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.url);
            return (
              <Link
                key={tab.url}
                href={tab.url}
                ref={(element) => {
                  tabRefs.current[tab.url] = element;
                }}
                className={`${styles.tabLink} ${isActive ? styles.tabLinkActive : styles.tabLinkInactive}`}
              >
                {tab.title}
              </Link>
            );
          })}
        </nav>
        <span ref={indicatorRef} className={styles.tabsIndicator} aria-hidden="true" />
      </div>
    </header>
  );
}
