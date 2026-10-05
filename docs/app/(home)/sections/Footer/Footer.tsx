"use client";
import svgPaths from "@/imports/svg-urruvoh2be";
import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useId, useSyncExternalStore } from "react";
import styles from "./Footer.module.css";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface SocialLink {
  label: string;
  href: string;
  viewBox: string;
  path: string;
  wrapperClassName?: string;
  clipId?: string;
  clipSize?: { width: string; height: string };
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Twitter",
    href: "https://x.com/thesysdev",
    viewBox: "0 0 24 24",
    path: svgPaths.pa1e7100,
    wrapperClassName: styles.socialIconTwitter,
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
    wrapperClassName: styles.socialIconYoutube,
    clipId: "clip_yt",
    clipSize: { width: "22", height: "15.4688" },
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/thesysdev/",
    viewBox: "0 0 19 19",
    path: svgPaths.p26fc3100,
    wrapperClassName: styles.socialIconLinkedIn,
    clipId: "clip_li",
    clipSize: { width: "19", height: "19" },
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SocialIcon({ link }: { link: SocialLink }) {
  const uniqueId = useId();
  const clipPathId = link.clipId ? `${link.clipId}-${uniqueId}` : undefined;

  const svgContent = clipPathId ? (
    <svg className={styles.absoluteSvg} fill="none" viewBox={link.viewBox}>
      <g clipPath={`url(#${clipPathId})`}>
        <path d={link.path} fill="currentColor" />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect fill="white" height={link.clipSize!.height} width={link.clipSize!.width} />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg className={styles.absoluteSvg} fill="none" viewBox={link.viewBox}>
      <path d={link.path} fill="currentColor" />
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
      {link.wrapperClassName ? (
        <div className={`${styles.socialIconWrap} ${link.wrapperClassName}`.trim()}>
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
        <path d={svgPaths.p16775200} fill="currentColor" />
        <path clipRule="evenodd" d={svgPaths.p29abae30} fill="currentColor" fillRule="evenodd" />
        <path d={svgPaths.p318aaf80} fill="currentColor" />
        <path d={svgPaths.p3f22cf00} fill="currentColor" />
        <path d={svgPaths.p27013980} fill="currentColor" />
        <path d={svgPaths.p21b7f300} fill="currentColor" />
      </svg>
    </div>
  );
}

// A segmented control rather than the header's single swap button: down here the
// current choice is worth showing, and "system" has no opposite to swap to.
// System sits in the middle, between the two it can resolve to.
const THEMES = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "system", label: "System", Icon: Monitor },
  { id: "dark", label: "Dark", Icon: Moon },
] as const;

// Never fires: the value we want differs only between the server snapshot and
// the client one, which is precisely the "have we hydrated yet" signal.
const NEVER_CHANGES = () => () => {};

function ThemeTabs() {
  // `theme`, not `resolvedTheme`: the latter resolves "system" to light or dark,
  // which would light up the wrong segment.
  const { setTheme, theme } = useTheme();
  // The server has no theme to render, so nothing is marked active until mount.
  // Read as an external store rather than set from an effect, which would kick
  // off a second render on every mount.
  const mounted = useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
  const active = mounted ? theme : undefined;

  return (
    <div className={styles.themeTabs} role="group" aria-label="Colour theme">
      {THEMES.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`${styles.themeTab} ${active === id ? styles.themeTabActive : ""}`.trim()}
          aria-pressed={active === id}
          aria-label={`Use ${label.toLowerCase()} theme`}
          title={`Use ${label.toLowerCase()} theme`}
          onClick={() => setTheme(id)}
        >
          {/* Line weight rather than fill: at 16px the solid shapes read as
              blobs, and the outline matches the social row below. */}
          <Icon className={styles.themeTabIcon} weight="regular" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Footer content */}
      <div className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Mark on the left, theme control on the right, sitting directly on
              the separator below. */}
          <div className={styles.brandRow}>
            <ThesysLogo />
            <ThemeTabs />
          </div>

          {/* Bottom bar */}
          <div className={styles.bottomBar}>
            <div className={styles.desktopBottomBar}>
              <p className={styles.desktopMetaLeft}>355 Bryant St, San Francisco, CA 94107</p>
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
                <p className={styles.mobileMetaText}>355 Bryant St, San Francisco, CA 94107</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
