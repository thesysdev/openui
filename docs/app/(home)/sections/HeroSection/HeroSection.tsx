"use client";

import { GitHubIcon } from "@/components/brand-logo";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ClipboardCommandButton, PillLink } from "../../components/Button/Button";
import styles from "./HeroSection.module.css";

// CTAs
const primaryCTA = "npx @openuidev/cli@latest create";
const secondaryCTA = "Try Playground";
const architectureHref = "/docs/openui-lang/how-it-works";
const DESKTOP_HERO_IMAGE = {
  light: "/homepage/hero-web.png",
  dark: "/homepage/hero-web-dark.png",
  width: 2040,
  height: 704,
} as const;
const MOBILE_HERO_IMAGE = {
  light: "/homepage/mobile-hero.png",
  dark: "/homepage/mobile-hero-dark.png",
  width: 804,
  height: 880,
} as const;

type HeroTheme = "light" | "dark";
// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function TrailingArrow() {
  return (
    <ArrowRight aria-hidden="true" className={styles.mobileCtaArrow} size={18} strokeWidth={2} />
  );
}

function NpmButton({ className = "" }: { className?: string }) {
  return (
    <ClipboardCommandButton
      command={primaryCTA}
      className={`${styles.npmButton} ${className}`.trim()}
      iconContainerClassName={styles.npmIconBadge}
      copyIconColor="white"
    >
      <span className={styles.npmDesktopLabel}>{primaryCTA}</span>
      <span className={styles.npmMobileLabel}>
        <span className={styles.npmTicker}>
          <span className={styles.npmTickerText}>{primaryCTA}</span>
          <span aria-hidden="true" className={styles.npmTickerText}>
            {primaryCTA}
          </span>
        </span>
      </span>
    </ClipboardCommandButton>
  );
}

function DesktopPlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/playground"
      className={`${styles.desktopPlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span>{secondaryCTA}</span>
    </PillLink>
  );
}

function MobilePlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/demo/github"
      className={`${styles.mobilePlaygroundButton} ${className}`.trim()}
      arrow={<TrailingArrow />}
    >
      <span className={styles.mobilePlaygroundLabel}>Try Demo</span>
    </PillLink>
  );
}

function AnnouncementBanner({ className = "" }: { className?: string }) {
  return (
    <>
      <div className={`${styles.heroBanner} ${styles.heroBannerDesktop} ${className}`.trim()}>
        <span className={styles.heroBannerLabel}>
          <span className={styles.heroBannerBadge}>New</span>
          <span>We&apos;re introducing OpenUI Lang v0.5</span>
        </span>
        <div className={styles.heroBannerActions}>
          <Link
            href="/demo/github"
            target="_blank"
            className={`${styles.heroBannerButton} ${styles.heroBannerButtonPrimary}`}
          >
            <span>Try</span>
          </Link>
          <Link href={architectureHref} className={styles.heroBannerButton}>
            <span>Read more</span>
          </Link>
        </div>
      </div>
      <Link
        href={architectureHref}
        className={`${styles.heroBanner} ${styles.heroBannerMobile} ${className}`.trim()}
      >
        <span className={styles.heroBannerLabel}>
          <span className={styles.heroBannerBadge}>New</span>
          <span>Introducing OpenUI Lang v0.5</span>
        </span>
      </Link>
    </>
  );
}

function GitHubBanner({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://github.com/thesysdev/openui"
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.heroBanner} ${styles.mobileGithubButton} ${className}`.trim()}
    >
      <span className={styles.heroBannerLead}>
        <span aria-hidden="true" className={styles.heroBannerIcon}>
          <GitHubIcon />
        </span>
        <span>Star us on Github</span>
      </span>
      <TrailingArrow />
    </a>
  );
}

// ---------------------------------------------------------------------------
// Desktop hero
// ---------------------------------------------------------------------------

function DesktopHero() {
  return (
    <div className={styles.desktopHero}>
      <div className={styles.desktopHeroInner}>
        <div className={styles.desktopHeroLockup}>
          <AnnouncementBanner />
          <h1 className={styles.desktopTitle}>OpenUI</h1>
          <p className={styles.desktopSubtitle}>The Open Standard for Generative UI</p>
        </div>

        <div className={styles.desktopCtaStack}>
          <NpmButton />
          <DesktopPlaygroundButton />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile hero
// ---------------------------------------------------------------------------

function MobileHero({ theme }: { theme: HeroTheme }) {
  const mobileHeroImage = theme === "dark" ? MOBILE_HERO_IMAGE.dark : MOBILE_HERO_IMAGE.light;

  return (
    <div className={styles.mobileHero}>
      <div className={styles.mobileHeroIntro}>
        <div className={styles.mobileHeroStack}>
          <AnnouncementBanner />

          <div className={styles.mobileBrandGroup}>
            <p className={styles.mobileTitle}>OpenUI</p>
          </div>

          {/* Subtitle */}
          <p className={styles.mobileSubtitle}>The Open Standard for Generative UI</p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className={styles.mobileCtaStack}>
        <NpmButton className={styles.mobileCtaButtonWidth} />
        <MobilePlaygroundButton className={styles.mobileCtaButtonWidth} />
        <GitHubBanner className={styles.mobileCtaButtonWidth} />
      </div>

      {/* Mobile hero image */}
      <div className={styles.mobileIllustrationViewport}>
        <img
          src={mobileHeroImage}
          alt="OpenUI mobile hero preview"
          width={MOBILE_HERO_IMAGE.width}
          height={MOBILE_HERO_IMAGE.height}
          className={styles.mobileIllustrationImage}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop preview image
// ---------------------------------------------------------------------------

function PreviewImage({ theme }: { theme: HeroTheme }) {
  const desktopHeroImage = theme === "dark" ? DESKTOP_HERO_IMAGE.dark : DESKTOP_HERO_IMAGE.light;

  return (
    <div className={styles.previewSection}>
      <div className={styles.previewDesktopOnly}>
        <div className={styles.previewFrame}>
          <img
            src={desktopHeroImage}
            alt="OpenUI desktop hero preview"
            width={DESKTOP_HERO_IMAGE.width}
            height={DESKTOP_HERO_IMAGE.height}
            className={styles.previewImage}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tagline
// ---------------------------------------------------------------------------

function Tagline() {
  return (
    <div className={styles.taglineSection}>
      <div className={styles.taglineContainer}>
        <p className={styles.tagline}>
          An open source toolkit to make your <br className={styles.taglineBreak} />
          AI apps respond with your UI.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function HeroSection() {
  const theme: HeroTheme = "light";

  return (
    <section className={styles.section}>
      <DesktopHero />
      <MobileHero theme={theme} />
      <PreviewImage theme={theme} />
      <Tagline />
    </section>
  );
}
