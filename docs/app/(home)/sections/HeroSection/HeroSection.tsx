"use client";

import { GitHubIcon } from "@/components/brand-logo";
import HeroPreviewFrame from "@/imports/Frame2147239423";
import svgMascotPaths from "@/imports/svg-148i9mcxjn";
import svgHeroPaths from "@/imports/svg-a5kdrdeeao";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ClipboardCommandButton, PillLink } from "../../components/Button/Button";
import styles from "./HeroSection.module.css";

const LazyMobileActionFigure = lazy(() => import("@/imports/MobileActionFigure"));

// CTAs
const primaryCTA = "npx @openuidev/cli@latest create";
const secondaryCTA = "Try Playground";
// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function NpmButton({ className = "" }: { className?: string }) {
  return (
    <ClipboardCommandButton
      command={primaryCTA}
      className={`${styles.npmButton} ${className}`.trim()}
      iconContainerClassName={styles.npmIconBadge}
      copyIconColor="white"
    >
      <span className={styles.npmDesktopLabel}>
        {primaryCTA}
      </span>
      <span className={styles.npmMobileLabel}>
        <span className={styles.npmTicker}>
          <span className={styles.npmTickerText}>
            {primaryCTA}
          </span>
          <span
            aria-hidden="true"
            className={styles.npmTickerText}
          >
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
      arrow={<span aria-hidden="true">→</span>}
    >
      <span>{secondaryCTA}</span>
    </PillLink>
  );
}

function MobilePlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <PillLink
      href="/playground"
      className={`${styles.mobilePlaygroundButton} ${className}`.trim()}
      arrow={
        <span aria-hidden="true" className={styles.mobilePlaygroundArrow}>
          →
        </span>
      }
    >
      <span className={styles.mobilePlaygroundLabel}>{secondaryCTA}</span>
    </PillLink>
  );
}

// ---------------------------------------------------------------------------
// Mascot SVG (mobile hero)
// ---------------------------------------------------------------------------

const MASCOT_STROKED_PATHS = [
  svgMascotPaths.p75ec1f0,
  svgMascotPaths.p3d8f4800,
  svgMascotPaths.p186ed000,
  svgMascotPaths.p5c95b80,
  svgMascotPaths.p2d8cb380,
] as const;

const MASCOT_FILLED_PATHS = [
  svgMascotPaths.p6bfe080,
  svgMascotPaths.pe416040,
  svgMascotPaths.p34c31400,
] as const;

function MascotSvg() {
  return (
    <svg
      className={styles.mobileMascotSvg}
      fill="none"
      viewBox="0 0 107.917 87.2814"
    >
      {MASCOT_STROKED_PATHS.map((d) => (
        <path key={d.slice(0, 20)} d={d} fill="black" stroke="black" strokeWidth="0.458571" />
      ))}
      {MASCOT_FILLED_PATHS.map((d) => (
        <path key={d.slice(0, 20)} d={d} fill="black" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Desktop hero
// ---------------------------------------------------------------------------

function DesktopHero() {
  return (
    <div className={styles.desktopHero}>
      <div className={styles.desktopHeroInner}>
        {/* Invisible spacer for aspect ratio */}
        <svg
          className={styles.desktopHeroSpacer}
          fill="none"
          viewBox="0 0 1600 376"
          aria-hidden="true"
        >
          <rect width="1600" height="376" />
        </svg>

        {/* Title */}
        <div className={styles.heroLayerMotion}>
          <svg className={styles.fillSvg} fill="none" viewBox="0 0 1600 376">
            <path d={svgHeroPaths.pb12f700} fill="black" />
          </svg>
        </div>

        {/* Subtitle */}
        <div className={styles.heroLayerMotion}>
          <svg className={styles.fillSvg} fill="none" viewBox="0 0 1600 376">
            <g transform="translate(180 0)">
              <g transform="translate(880 75) scale(1.5) translate(-980 -108)">
                <path d={svgHeroPaths.p38a6ed80} fill="black" fillOpacity="0.4" />
              </g>
            </g>
          </svg>
        </div>

        {/* CTA buttons */}
        <div className={styles.desktopCtaLayer}>
          <div className={styles.desktopCtaStack}>
            <NpmButton />
            <DesktopPlaygroundButton />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile hero
// ---------------------------------------------------------------------------

function MobileHero() {
  return (
    <div className={styles.mobileHero}>
      <div className={styles.mobileHeroIntro}>
        <div className={styles.mobileHeroStack}>
          <a
            href="https://github.com/thesysdev/openui"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileGithubBanner}
          >
            <span className={styles.mobileGithubBannerLead}>
              <span aria-hidden="true" className={styles.mobileGithubBannerIcon}>
                <GitHubIcon />
              </span>
              <span>Star us on Github</span>
            </span>
            <span aria-hidden="true" className={styles.mobileGithubBannerArrow}>
              →
            </span>
          </a>

          <div className={styles.mobileBrandGroup}>
            <div className={styles.mobileMascotWrap}>
              <MascotSvg />
            </div>

            {/* Title */}
            <p className={styles.mobileTitle}>
              OpenUI
            </p>
          </div>

          {/* Subtitle */}
          <p className={styles.mobileSubtitle}>
            The Open Standard
            <br />
            for Generative UI
          </p>
        </div>
      </div>

      {/* CTA buttons */}
      <div className={styles.mobileCtaStack}>
        <MobilePlaygroundButton className={styles.mobileCtaButtonWidth} />
        <NpmButton className={styles.mobileCtaButtonWidth} />
      </div>

      {/* Full-width hero illustration */}
      <div className={styles.mobileIllustrationViewport}>
        <Suspense fallback={<div className={styles.mobileIllustrationFallback} />}>
          <LazyMobileActionFigure />
        </Suspense>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop preview frame (ResizeObserver-scaled)
// ---------------------------------------------------------------------------

const PREVIEW_NATIVE_WIDTH = 1600;
const PREVIEW_SCALE_MULTIPLIER = 1.25;

function ScaledPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / PREVIEW_NATIVE_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!frameRef.current) return;
    frameRef.current.style.setProperty("--preview-scale", String(scale * PREVIEW_SCALE_MULTIPLIER));
  }, [scale]);

  return (
    <div ref={containerRef} className={styles.previewScaleContainer}>
      <div ref={frameRef} className={styles.previewScaleFrame}>
        <HeroPreviewFrame />
      </div>
    </div>
  );
}

function PreviewImage() {
  return (
    <div className={styles.previewSection}>
      <div className={styles.previewDesktopOnly}>
        <div className={styles.previewFrame}>
          <ScaledPreview />
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
  return (
    <section className={styles.section}>
      <DesktopHero />
      <MobileHero />
      <PreviewImage />
      <Tagline />
    </section>
  );
}
