"use client";

import { GitHubIcon } from "@/components/brand-logo";
import HeroPreviewFrame from "@/imports/Frame2147239423";
import svgMascotPaths from "@/imports/svg-148i9mcxjn";
import svgHeroPaths from "@/imports/svg-a5kdrdeeao";
import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { CopyIcon } from "../shared/shared";
import styles from "./HeroSection.module.css";

const LazyMobileActionFigure = lazy(() => import("@/imports/MobileActionFigure"));

const HERO_BUTTON_SHADOW = "0 1.5px 5px 0 rgba(22, 34, 51, 0.06), 0 12px 24px 0 rgba(22, 34, 51, 0.04)";
const HERO_BUTTON_STYLE = {
  "--hero-button-shadow": HERO_BUTTON_SHADOW,
} as CSSProperties;

// CTAs
const primaryCTA = "npm install @openuidev/lang-react @openuidev/react-ui";
const secondaryCTA = "Try Playground";
const COPIED_FEEDBACK_MS = 3000;
// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function NpmButton({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(primaryCTA);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, COPIED_FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <button
        className={`${styles.npmButton} ${className}`.trim()}
        style={HERO_BUTTON_STYLE}
        onClick={onCopy}
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
        <span className={styles.npmIconBadge}>
          <span className={styles.npmIconFrame}>
            <span
              className={`${styles.iconLayer} ${copied ? styles.iconHidden : styles.iconVisible}`}
            >
              <CopyIcon color="white" />
            </span>
            <svg
              className={`${styles.iconLayer} ${copied ? styles.iconVisible : styles.iconHidden}`}
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </span>
        </span>
      </button>
    </>
  );
}

function DesktopPlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="/playground"
      className={`${styles.desktopPlaygroundButton} ${className}`.trim()}
    >
      <span>{secondaryCTA}</span>
      <span aria-hidden="true">→</span>
    </a>
  );
}

function MobilePlaygroundButton({ className = "" }: { className?: string }) {
  return (
    <a href="/playground" className={`${styles.mobilePlaygroundButton} ${className}`.trim()}>
      <span className={styles.mobilePlaygroundLabel}>{secondaryCTA}</span>
      <span aria-hidden="true" className={styles.mobilePlaygroundArrow}>
        →
      </span>
    </a>
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

        {/* Grid lines */}
        <div className={styles.heroLayerFade}>
          <svg
            className={styles.fillSvg}
            fill="none"
            viewBox="0 0 1600 376"
            preserveAspectRatio="none"
          >
            <defs>
              {[189, 787].map((x) => (
                <linearGradient
                  key={x}
                  id={`heroVFade${x}`}
                  x1={x}
                  x2={x}
                  y1="0"
                  y2="376"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="black" stopOpacity="0" />
                  <stop offset="0.15" stopColor="black" stopOpacity="1" />
                  <stop offset="0.85" stopColor="black" stopOpacity="1" />
                  <stop offset="1" stopColor="black" stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            <path d="M0 112H1600" stroke="black" strokeOpacity="0.1" />
            <path d="M0 243H1600" stroke="black" strokeOpacity="0.1" />
            <path d="M189 0V376" stroke="url(#heroVFade189)" strokeOpacity="0.1" />
            <path d="M787 0V376" stroke="url(#heroVFade787)" strokeOpacity="0.1" />
          </svg>
        </div>

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

        {/* Edge fades */}
        <div className={styles.leftFade} />
        <div className={styles.rightFade} />

        {/* CTA buttons */}
        <div
          className={styles.desktopCtaLayer}
          style={{ left: "50%", top: "71.19%" }}
        >
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
          <div className={styles.mobileMascotWrap}>
            <MascotSvg />
          </div>

          {/* Title */}
          <p className={styles.mobileTitle} style={{ fontWeight: 600 }}>
            OpenUI
          </p>

          {/* Subtitle */}
          <p className={styles.mobileSubtitle} style={{ fontWeight: 500 }}>
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
const PREVIEW_NATIVE_HEIGHT = 518;
const PREVIEW_SCALE_MULTIPLIER = 1.25;

function ScaledPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={containerRef} className={styles.previewScaleContainer}>
      <div
        className={styles.previewScaleFrame}
        style={{
          width: PREVIEW_NATIVE_WIDTH,
          height: PREVIEW_NATIVE_HEIGHT,
          transform: `translateX(-50%) scale(${scale * PREVIEW_SCALE_MULTIPLIER})`,
        }}
      >
        <HeroPreviewFrame />
      </div>
    </div>
  );
}

function PreviewImage() {
  return (
    <div className={styles.previewSection}>
      <div className={styles.previewDesktopOnly}>
        <div
          className={styles.previewFrame}
          style={{
            width: "calc(100% + 240px)",
            maxWidth: "100vw",
            aspectRatio: `${PREVIEW_NATIVE_WIDTH} / ${PREVIEW_NATIVE_HEIGHT}`,
            marginInline: "-120px",
          }}
        >
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
