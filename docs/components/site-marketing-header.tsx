"use client";

import { GitHubButton } from "@/app/(home)/components/GitHubButton/GitHubButton";
import { type LogoVariant } from "@/components/brand-logo";
import { SiteHeaderFrame } from "@/components/site-header";
import {
  dropdownChildren,
  dropdownGroups,
  isNavDropdown,
  PRIMARY_SITE_NAV_ITEMS,
  SitePrimaryNav,
} from "@/components/site-primary-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import styles from "./site-marketing-header.module.css";

type ThemeToggleConfig = {
  onToggle?: () => void;
  title?: string;
  ariaLabel?: string;
};

type SiteMarketingHeaderProps = {
  borderMode?: "always" | "scroll";
  themeToggle?: ThemeToggleConfig | null;
  brandVariant?: LogoVariant;
};

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

/* The tray takes its sections straight from the nav data: one per dropdown, in
   nav order, then everything that has no menu of its own gathered under
   Resources. Product used to be assembled here by name, because it existed only
   as scattered top-level links; it is a real menu now, so it arrives with the
   rest.

   The Open source / Cloud split is flattened away. It divides three links, and
   two heading rows to separate them costs more than it explains at tray width. */
function MobileMenu({ onClose }: { onClose: () => void }) {
  const leafItems = PRIMARY_SITE_NAV_ITEMS.filter(
    (item): item is Extract<(typeof PRIMARY_SITE_NAV_ITEMS)[number], { href: string }> =>
      !isNavDropdown(item),
  );
  /* A short menu stays one section under its own name. A long one lists its
     groups as sections instead, because a single heading over eleven links tells
     you nothing about where you are in them. Resources is the only menu long
     enough to need it, which is what `layout: "list"` already marks. */
  const sections = PRIMARY_SITE_NAV_ITEMS.filter(isNavDropdown).flatMap((menu) =>
    menu.layout === "list"
      ? dropdownGroups(menu).map((group) => ({ title: group.label, items: group.children }))
      : [{ title: menu.title, items: dropdownChildren(menu) }],
  );

  /* Top-level links that no section already covers get folded into the last one
     rather than trailing loose underneath it. Benchmarks is deliberately not one
     of them: it is duplicated in the nav on purpose while it is new, and the
     tray already lists it under Other, so the second copy is dropped here. */
  const covered = new Set(sections.flatMap((section) => section.items.map((item) => item.href)));
  const extras = leafItems.filter((leaf) => !covered.has(leaf.href));
  if (extras.length > 0 && sections.length > 0) {
    const last = sections[sections.length - 1];
    sections[sections.length - 1] = { ...last, items: [...last.items, ...extras] };
  }

  /* One open section at a time, starting on the first: the tray should open with
     something to read rather than a wall of closed headings, and Product is what
     leads the nav. Collapsible like the rest, just not collapsed to begin with. */
  const [openSection, setOpenSection] = useState<string | null>(sections[0]?.title ?? null);

  const renderTrayLink = (entry: {
    title: string;
    href: string;
    newTab?: boolean;
    badge?: string;
    /* The dropdown's status chip, carried through from the nav data. A tray row
       has no description to sit under, so unlike the desktop card it shares the
       badge slot beside the title. */
    tag?: string;
    comingSoon?: true;
  }) =>
    /* Matches the desktop menu: announced, tagged, and not a link. */
    entry.comingSoon ? (
      <span
        key={entry.href}
        className={`${styles.mobileTrayLink} ${styles.mobileTrayLinkMuted}`}
        aria-disabled
      >
        <span>{entry.title}</span>
        <span className={styles.mobileTrayComingSoon}>Coming soon</span>
      </span>
    ) : (
      <Link
        key={entry.href}
        className={styles.mobileTrayLink}
        href={entry.href}
        onClick={onClose}
        {...(entry.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span>{entry.title}</span>
        {/* A top-level badge wins if an item somehow carries both; in practice
            they never do, since badges come from leaf links and tags from
            dropdown children. */}
        {(entry.badge ?? entry.tag) && (
          <span className={styles.mobileTrayBadge}>{entry.badge ?? entry.tag}</span>
        )}
      </Link>
    );

  return (
    <>
      <motion.div
        className={styles.mobileBackdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.mobileTrayWrap}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <div className={styles.mobileTray}>
          <div className={styles.mobileTrayInner}>
            {sections.map((section) => {
              const isOpen = openSection === section.title;
              return (
                <div key={section.title} className={styles.mobileTraySection}>
                  <button
                    type="button"
                    className={styles.mobileTraySectionHeading}
                    aria-expanded={isOpen}
                    onClick={() => setOpenSection(isOpen ? null : section.title)}
                  >
                    <span>{section.title}</span>
                    <ChevronDown
                      className={`${styles.mobileTrayChevron} ${
                        isOpen ? styles.mobileTrayChevronOpen : ""
                      }`.trim()}
                      size={16}
                      aria-hidden="true"
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        className={styles.mobileTraySectionItems}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
                      >
                        {section.items.map(renderTrayLink)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            <div className={styles.mobileTrayFooter}>
              <GitHubButton
                variant="desktopGlow"
                compact
                href="https://github.com/thesysdev/openui"
                arrow={
                  <ArrowRight
                    className={styles.mobileTrayArrow}
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                }
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export function SiteMarketingHeader({
  borderMode = "scroll",
  themeToggle,
  brandVariant,
}: SiteMarketingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(borderMode === "always");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const resolvedBrandVariant =
    brandVariant ?? (mounted && resolvedTheme === "dark" ? "dark" : "light");

  useEffect(() => {
    if (borderMode === "always") {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [borderMode]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const isBordered = borderMode === "always" || isScrolled;

  return (
    <nav className={styles.nav}>
      <SiteHeaderFrame
        variant="home"
        bordered={isBordered}
        borderColor="var(--openui-border-interactive)"
        dividerColor="var(--openui-border-interactive)"
        brandVariant={resolvedBrandVariant}
        center={<SitePrimaryNav />}
        end={
          <div className={styles.desktopActions}>
            <GitHubButton
              variant="desktopGlow"
              compact
              href="https://github.com/thesysdev/openui"
            />
          </div>
        }
        mobileEnd={
          <div className={styles.mobileEndActions}>
            {isMobileMenuOpen && themeToggle !== null && (
              <ThemeToggle
                onToggle={themeToggle?.onToggle}
                title={themeToggle?.title}
                ariaLabel={themeToggle?.ariaLabel}
              />
            )}
            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <HamburgerIcon isOpen={isMobileMenuOpen} />
            </button>
          </div>
        }
      />
      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu onClose={closeMobileMenu} />}
      </AnimatePresence>
    </nav>
  );
}
