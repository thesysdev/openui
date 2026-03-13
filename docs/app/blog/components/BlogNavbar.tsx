"use client";

import {
  GitHubIcon,
  OpenUILogo,
  StarCountBadge,
  ThesysLogo,
  useGitHubStarCount,
} from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState, type CSSProperties } from "react";

const BUTTON_SHADOW = "0px 1px 3px 0px rgba(22,34,51,0.08), 0px 12px 24px 0px rgba(22,34,51,0.04)";

const NAV_TABS = ["OpenUI Lang", "Playground", "API Reference", "Blog"] as const;
const TAB_URLS: Record<string, string> = {
  "OpenUI Lang": "/docs/openui-lang",
  Playground: "/playground",
  "API Reference": "/docs/api-reference",
  Blog: "/blog",
};

function DesktopNavTabs() {
  return (
    <div className="hidden lg:flex items-center gap-2">
      {NAV_TABS.map((tab) => (
        <a
          key={tab}
          href={TAB_URLS[tab]}
          className="flex h-8 items-center px-2 rounded-md text-[var(--blog-nav-text)] no-underline transition-colors duration-200 font-['Inter_Display',sans-serif] text-[15px] leading-6 hover:bg-[var(--blog-nav-hover)]"
        >
          {tab}
        </a>
      ))}
    </div>
  );
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {isOpen ? (
        <>
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </>
      ) : (
        <>
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </>
      )}
    </svg>
  );
}

function MobileMenu({ starCount, onClose }: { starCount: number; onClose: () => void }) {
  const mobileGithubStyle = {
    "--mobile-github-button-shadow": BUTTON_SHADOW,
  } as CSSProperties;

  return (
    <>
      <motion.div
        className="absolute top-full left-0 right-0 z-40 h-screen cursor-pointer bg-black/60 backdrop-blur-[12px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute top-full left-0 right-0 z-50 pointer-events-none lg:hidden"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <div className="pointer-events-auto border-t border-[var(--blog-nav-border)] rounded-b-[18px] bg-[var(--blog-nav-bg)] shadow-[0_10px_20px_rgb(0_0_0/0.1)]">
          <div className="flex max-w-[75rem] mx-auto flex-col gap-0 pt-3 px-[1.75rem] pb-5">
            {NAV_TABS.map((tab, index) => (
              <div key={tab}>
                {index > 0 && <div className="h-px mx-3 bg-[var(--blog-nav-border)]" />}
                <a
                  href={TAB_URLS[tab]}
                  className="flex w-full h-14 items-center gap-1 px-3 rounded-md text-[var(--blog-nav-text)] text-left no-underline transition-colors duration-200 font-['Inter',sans-serif] text-lg leading-6 hover:bg-[var(--blog-nav-hover)]"
                >
                  {tab}
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center pt-20 pointer-events-auto">
          <a
            href="https://github.com/thesysdev/openui"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-[38px] items-center gap-1.5 pl-3 pr-2 border-0 rounded-full bg-[var(--blog-nav-bg)] cursor-pointer scale-[1.17]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none border border-[var(--blog-nav-border)] rounded-full shadow-[var(--mobile-github-button-shadow,none)] transition-shadow duration-200 group-hover:shadow-none"
              style={mobileGithubStyle}
            />
            <GitHubIcon />
            <StarCountBadge count={starCount} isHighlighted={false} />
          </a>
        </div>
      </motion.div>
    </>
  );
}

export function BlogNavbar() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const starCount = useGitHubStarCount("thesysdev/openui");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const logoVariant = isDark ? "dark" : "light";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const navStyle = {
    "--blog-nav-bg": isDark ? "#0b0b0f" : "#fff",
    "--blog-nav-text": isDark ? "#e2e1e6" : "#000",
    "--blog-nav-border": isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    "--blog-nav-hover": isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    borderBottom: `1px solid ${isScrolled ? borderColor : "transparent"}`,
  } as CSSProperties;

  return (
    <nav
      className="sticky top-0 z-50 w-full py-3 px-8 bg-[var(--blog-nav-bg)] transition-[border-color] duration-200 ease-in-out"
      style={navStyle}
    >
      <div className="flex max-w-[75rem] mx-auto items-center justify-between">
        <div className="flex items-center gap-2">
          <ThesysLogo
            isHovered={isLogoHovered}
            onHoverChange={setIsLogoHovered}
            variant={logoVariant}
          />
          <div className="h-4 w-px bg-[var(--blog-nav-border)]" />
          <OpenUILogo variant={logoVariant} />
        </div>

        <DesktopNavTabs />

        <div className="hidden lg:flex items-center gap-2">
          <a
            href="https://github.com/thesysdev/openui"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center size-9 rounded-lg text-fd-muted-foreground no-underline hover:text-fd-foreground hover:bg-fd-accent transition-colors"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <ThemeToggle />
        </div>

        <button
          className="flex size-10 items-center justify-center border-0 rounded-lg bg-transparent text-[var(--blog-nav-text)] cursor-pointer transition-colors duration-200 hover:bg-[var(--blog-nav-hover)] lg:hidden"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu starCount={starCount} onClose={toggleMobileMenu} />}
      </AnimatePresence>
    </nav>
  );
}
