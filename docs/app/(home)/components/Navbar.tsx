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
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { BUTTON_SHADOW } from "./shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NAV_TABS = ["OpenUI Lang", "Chat", "Playground", "API Reference"] as const;
const TAB_URLS: Record<string, string> = {
  "OpenUI Lang": "/docs/openui-lang",
  Chat: "/docs/chat",
  Playground: "/playground",
  "API Reference": "/docs/api-reference",
};
const NAVBAR_BORDER_COLOR = "rgba(0,0,0,0.1)";

// ---------------------------------------------------------------------------
// Shared SVG icons
// ---------------------------------------------------------------------------

function ChevronDownIcon() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 20 20">
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
    <div className="hidden lg:flex items-center gap-2">
      {NAV_TABS.map((tab) => (
        <a
          key={tab}
          href={TAB_URLS[tab]}
          className="h-8 px-2 rounded-md font-['Inter_Display',sans-serif] text-[15px] text-black leading-6 hover:bg-black/5 transition-colors no-underline flex items-center"
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
  return (
    <>
      {/* Backdrop overlay — below navbar (absolute top-full), covers rest of viewport */}
      <motion.div
        className="lg:hidden absolute top-full left-0 right-0 h-screen bg-black/60 backdrop-blur-md z-40 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Tray + floating GitHub button */}
      <motion.div
        className="lg:hidden absolute left-0 right-0 top-full z-50 pointer-events-none"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {/* Tray */}
        <div className="bg-white border-t border-black/5 rounded-b-[18px] shadow-lg pointer-events-auto">
          <div className="flex flex-col px-7 pt-3 pb-5 gap-0 max-w-[1200px] mx-auto">
            {[...NAV_TABS, "Components"].map((tab, index) => (
              <div key={tab}>
                {index > 0 && <div className="h-px bg-black/5 mx-3" />}
                <a
                  href={TAB_URLS[tab]}
                  className="h-14 px-3 rounded-md font-['Inter',sans-serif] text-black leading-6 hover:bg-black/5 transition-colors text-left w-full text-[18px] flex items-center gap-1 no-underline"
                >
                  {tab}
                  {tab === "Components" && <ChevronDownIcon />}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub button — centered, 80px below tray, scaled up 140% */}
        <div className="flex justify-center pt-[80px] pointer-events-auto">
          <button className="bg-white flex items-center gap-1.5 h-[38px] pl-3 pr-2 rounded-full relative cursor-pointer scale-[1.17]">
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none rounded-full border border-black/10"
              style={{ boxShadow: BUTTON_SHADOW }}
            />
            <GitHubIcon />
            <StarCountBadge count={starCount} isHighlighted={false} />
          </button>
        </div>
      </motion.div>
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
      className="w-full sticky top-0 z-50 bg-white px-8 py-1 transition-[border-color] duration-200"
      style={{ borderBottom: `1px solid ${isScrolled ? NAVBAR_BORDER_COLOR : "transparent"}` }}
    >
      <div className="flex items-center justify-between max-w-300 mx-auto">
        {/* Left: Logos */}
        <div className="flex items-center gap-2">
          <ThesysLogo isHovered={isLogoHovered} onHoverChange={setIsLogoHovered} />
          <div className="h-4 w-px bg-black/10" />
          <OpenUILogo />
        </div>

        {/* Center: Nav tabs (desktop only) */}
        <DesktopNavTabs />

        {/* Right: GitHub button (desktop only) */}
        <div className="hidden lg:flex">
          <GitHubStarButton repo="thesysdev/openui" isScrolled={isScrolled} />
        </div>

        {/* Right: Hamburger (mobile only) */}
        <button
          className="lg:hidden flex items-center justify-center size-10 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <HamburgerIcon isOpen={isMobileMenuOpen} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu starCount={starCount} onClose={toggleMobileMenu} />}
      </AnimatePresence>
    </nav>
  );
}
