"use client";

import { SiteMarketingHeader } from "@/components/site-marketing-header";
import { Star } from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

export function Navbar() {
  const pathname = usePathname();
  const normalizedPath = pathname?.toLowerCase();
  const showNavBanner = normalizedPath === "/" || normalizedPath === "/openclaw-os";

  return (
    <>
      {showNavBanner && (
        <a
          href="https://github.com/thesysdev/openui"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navBanner}
        >
          <span className={styles.navBannerText}>
            <span>Thesys is going open source!</span>
          </span>
          <span className={styles.navBannerButton}>
            <Star size={14} strokeWidth={2.25} className={styles.navBannerStar} />
            Star us on GitHub
          </span>
        </a>
      )}
      <SiteMarketingHeader borderMode="scroll" themeToggle={null} brandVariant="light" />
    </>
  );
}
