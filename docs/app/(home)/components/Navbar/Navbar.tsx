"use client";

import {
  GitHubIcon,
  GitHubStarButton,
  OpenUILogo,
  StarCountBadge,
  ThesysLogo,
  useGitHubStarCount,
} from "@/components/brand-logo";
import svgPaths from "@/imports/svg-urruvoh2be";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { BUTTON_SHADOW } from "../shared/shared";
import styles from "./Navbar.module.css";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NAV_TABS = ["Introduction", "OpenUI Lang", "Chat", "Playground", "API Reference"] as const;
const TAB_URLS: Record<string, string> = {
  Introduction: "/docs/introduction",
  "OpenUI Lang": "/docs/openui-lang",
  Chat: "/docs/chat",
  Playground: "/playground",
  "API Reference": "/docs/api-reference",
  Components: "/docs/components",
};
const NAVBAR_BORDER_COLOR = "rgba(0,0,0,0.1)";
const MOBILE_GITHUB_BUTTON_STYLE = {
  "--mobile-github-button-shadow": BUTTON_SHADOW,
} as CSSProperties;

// ---------------------------------------------------------------------------
// Shared SVG icons
// ---------------------------------------------------------------------------

function ChevronDownIcon() {
  return (
    <svg className={styles.chevronIcon} fill="none" viewBox="0 0 20 20">
      <path
        d={svgPaths.p2709b200}
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DesktopNavTabs() {
  return (
    <div className={styles.desktopTabs}>
      {NAV_TABS.map((tab) => (
        <a
          key={tab}
          href={TAB_URLS[tab]}
          className={styles.desktopTabLink}
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
      className={styles.hamburgerIcon}
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
  return (
    <>
      {/* Backdrop overlay — below navbar (absolute top-full), covers rest of viewport */}
      <div
        className={styles.mobileBackdrop}
        onClick={onClose}
      />

      {/* Tray + floating GitHub button */}
      <div className={styles.mobileTrayWrap}>
        {/* Tray */}
        <div className={styles.mobileTray}>
          <div className={styles.mobileTrayInner}>
            {[...NAV_TABS, "Components"].map((tab, index) => (
              <div key={tab}>
                {index > 0 && <div className={styles.mobileTrayDivider} />}
                <a
                  href={TAB_URLS[tab]}
                  className={styles.mobileTrayLink}
                >
                  {tab}
                  {tab === "Components" && <ChevronDownIcon />}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub button — centered, 80px below tray, scaled up 140% */}
        <div className={styles.mobileGithubButtonWrap}>
          <button className={styles.mobileGithubButton}>
            <div
              aria-hidden="true"
              className={styles.mobileGithubButtonOverlay}
              style={MOBILE_GITHUB_BUTTON_STYLE}
            />
            <GitHubIcon />
            <StarCountBadge count={starCount} isHighlighted={false} />
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Navbar() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const starCount = useGitHubStarCount("thesysdev/openui");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <nav
      className={styles.nav}
      style={{ borderBottom: `1px solid ${isScrolled ? NAVBAR_BORDER_COLOR : "transparent"}` }}
    >
      <div className={styles.navInner}>
        {/* Left: Logos */}
        <div className={styles.logoCluster}>
          <ThesysLogo isHovered={isLogoHovered} onHoverChange={setIsLogoHovered} />
          <div className={styles.logoDivider} />
          <OpenUILogo />
        </div>

        {/* Center: Nav tabs (desktop only) */}
        <DesktopNavTabs />

        {/* Right: GitHub button (desktop only) */}
        <div className={styles.desktopGithub}>
          <GitHubStarButton repo="thesysdev/openui" isScrolled={isScrolled} />
        </div>

        {/* Right: Hamburger (mobile only) */}
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isMobileMenuOpen && <MobileMenu starCount={starCount} onClose={toggleMobileMenu} />}
    </nav>
  );
}
