"use client";

import type { CSSProperties } from "react";
import svgPaths from "@/imports/svg-urruvoh2be";
import mascotSvgPaths from "@/imports/svg-xeurqn3j1r";
import styles from "./Footer.module.css";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface SocialLink {
  label: string;
  href: string;
  viewBox: string;
  path: string;
  wrapperStyle?: CSSProperties;
  clipId?: string;
  clipSize?: { width: string; height: string };
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Twitter",
    href: "https://x.com/thesysdev",
    viewBox: "0 0 24 24",
    path: svgPaths.pa1e7100,
    wrapperStyle: { inset: "10.82% 4.33% 18.35% 4.17%" },
  },
  {
    label: "Discord",
    href: "https://discord.com/invite/Pbv5PsqUSv",
    viewBox: "0 0 21.9611 17",
    path: svgPaths.p3885cd00,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@thesysdev",
    viewBox: "0 0 22 15.4688",
    path: svgPaths.p23dbbd00,
    wrapperStyle: {
      left: "50%",
      top: "50%",
      width: "22px",
      height: "15.469px",
      transform: "translate(-50%, -50%)",
    },
    clipId: "clip_yt",
    clipSize: { width: "22", height: "15.4688" },
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/thesysdev/",
    viewBox: "0 0 19 19",
    path: svgPaths.p26fc3100,
    wrapperStyle: {
      left: "50%",
      top: "50%",
      width: "19px",
      height: "19px",
      transform: "translate(-50%, -50%)",
    },
    clipId: "clip_li",
    clipSize: { width: "19", height: "19" },
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SocialIcon({ link }: { link: SocialLink }) {
  const svgContent = link.clipId ? (
    <svg className={styles.absoluteSvg} fill="none" viewBox={link.viewBox}>
      <g clipPath={`url(#${link.clipId})`}>
        <path d={link.path} fill="black" fillOpacity="0.4" />
      </g>
      <defs>
        <clipPath id={link.clipId}>
          <rect fill="white" height={link.clipSize!.height} width={link.clipSize!.width} />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg className={styles.absoluteSvg} fill="none" viewBox={link.viewBox}>
      <path d={link.path} fill="black" fillOpacity="0.4" />
    </svg>
  );

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.socialLink}
      aria-label={link.label}
    >
      {link.wrapperStyle ? (
        <div className={styles.socialIconWrap} style={link.wrapperStyle}>
          {svgContent}
        </div>
      ) : (
        svgContent
      )}
    </a>
  );
}

function SocialIcons() {
  return (
    <div className={styles.socialIcons}>
      {SOCIAL_LINKS.map((link) => (
        <SocialIcon key={link.label} link={link} />
      ))}
    </div>
  );
}

function ThesysLogo() {
  return (
    <div className={styles.logoWrap}>
      <svg className={styles.absoluteSvg} fill="none" viewBox="0 0 123.871 49.5484">
        <path d={svgPaths.p16775200} fill="black" />
        <path clipRule="evenodd" d={svgPaths.p29abae30} fill="black" fillRule="evenodd" />
        <path d={svgPaths.p318aaf80} fill="black" />
        <path d={svgPaths.p3f22cf00} fill="black" />
        <path d={svgPaths.p27013980} fill="black" />
        <path d={svgPaths.p21b7f300} fill="black" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Handcrafted */}
      <div className={styles.handcraftedSection}>
        <div className={styles.handcraftedContainer}>
          <div className={styles.mascotWrap}>
            <svg
              className={styles.handcraftedMascot}
              fill="none"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 141.2 114.2"
            >
              <path d={mascotSvgPaths.p395b3c00} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p3b251e80} fill="black" />
              <path d={mascotSvgPaths.p2718bc80} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p37ab5b0} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p2ac89300} fill="black" />
              <path d={mascotSvgPaths.p2b8b4380} fill="black" />
              <path d={mascotSvgPaths.p15c14e00} fill="black" stroke="black" strokeWidth="0.6" />
              <path d={mascotSvgPaths.p4076200} fill="black" stroke="black" strokeWidth="0.6" />
            </svg>
          </div>
          <p className={styles.handcraftedCopy}>
            Handcrafted with a lot of love.
          </p>
        </div>
      </div>

      {/* Footer content */}
      <div className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Desktop */}
          <div className={styles.desktopLogoRow}>
            <ThesysLogo />
          </div>
          {/* Mobile */}
          <div className={styles.mobileLogoRow}>
            <ThesysLogo />
          </div>

          {/* Bottom bar */}
          <div className={styles.bottomBar}>
            <div className={styles.desktopBottomBar}>
              <p className={styles.desktopMetaLeft}>
                355 Bryant St, San Francisco, CA 94107
              </p>
              <SocialIcons />
              <p className={styles.desktopMetaRight}>
                © {new Date().getFullYear()} Thesys Inc. All Rights Reserved
              </p>
            </div>

            <div className={styles.mobileBottomBar}>
              <SocialIcons />
              <div className={styles.mobileMeta}>
                <p className={styles.mobileMetaText}>
                  © {new Date().getFullYear()} Thesys Inc. All Rights Reserved
                </p>
                <p className={styles.mobileMetaText}>
                  355 Bryant St, San Francisco, CA 94107
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
