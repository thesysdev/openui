import svgPaths from "@/imports/svg-urruvoh2be";
import { SITE_NAV_LINKS } from "@/lib/site-nav-links";
import Link from "next/link";
import { useId } from "react";
import styles from "./Footer.module.css";
import { ThemeTabs } from "./ThemeTabs";

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
    href: "https://x.com/openuidev",
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
    href: "https://www.linkedin.com/showcase/openui-com/",
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
    <a
      className={styles.logoWrap}
      href="https://thesys.dev"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Thesys"
    >
      <svg className={styles.absoluteSvg} fill="none" viewBox="0 0 123.871 49.5484">
        <path d={svgPaths.p16775200} fill="currentColor" />
        <path clipRule="evenodd" d={svgPaths.p29abae30} fill="currentColor" fillRule="evenodd" />
        <path d={svgPaths.p318aaf80} fill="currentColor" />
        <path d={svgPaths.p3f22cf00} fill="currentColor" />
        <path d={svgPaths.p27013980} fill="currentColor" />
        <path d={svgPaths.p21b7f300} fill="currentColor" />
      </svg>
    </a>
  );
}

type FooterLink = { title: string; href: string; newTab?: boolean };

const FOOTER_GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Products",
    links: [
      { title: "OpenUI", ...SITE_NAV_LINKS.openui },
      { title: "Gateway", ...SITE_NAV_LINKS.gateway },
      { title: "Observability", ...SITE_NAV_LINKS.observability },
      { title: "Dashboards", ...SITE_NAV_LINKS.dashboards },
      { title: "Pricing", ...SITE_NAV_LINKS.pricing },
    ],
  },
  {
    title: "Build",
    links: [
      { title: "Getting Started", ...SITE_NAV_LINKS.gettingStarted },
      { title: "Documentation", ...SITE_NAV_LINKS.documentation },
      { title: "Cookbooks", ...SITE_NAV_LINKS.cookbooks },
      { title: "Integrations", ...SITE_NAV_LINKS.integrations },
      { title: "API Reference", ...SITE_NAV_LINKS.apiReference },
    ],
  },
  {
    title: "Explore",
    links: [
      { title: "All Demos", ...SITE_NAV_LINKS.demos },
      { title: "Northstar Sales Agent", ...SITE_NAV_LINKS.northstar },
      { title: "Open Intelligent UI", ...SITE_NAV_LINKS.openIntelligentUi },
      { title: "F1 Dashboard", ...SITE_NAV_LINKS.f1Dashboard },
      { title: "Trip Planner", ...SITE_NAV_LINKS.tripPlanner },
    ],
  },
  {
    title: "Labs",
    links: [
      { title: "OUI-1", ...SITE_NAV_LINKS.oui1 },
      { title: "OpenClaw OS", ...SITE_NAV_LINKS.openClawOs },
      { title: "AppLess", ...SITE_NAV_LINKS.appless },
      { title: "Community Projects", ...SITE_NAV_LINKS.community },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Blog", ...SITE_NAV_LINKS.blog },
      { title: "Benchmarks", ...SITE_NAV_LINKS.benchmarks },
      { title: "GitHub", href: "https://github.com/thesysdev/openui", newTab: true },
      { title: "Discord", href: "https://discord.com/invite/Pbv5PsqUSv", newTab: true },
    ],
  },
];

function FooterLinks() {
  return (
    <nav className={styles.navigation} aria-label="Footer">
      {FOOTER_GROUPS.map((group) => (
        <div key={group.title}>
          <h2 className={styles.navigationHeading}>{group.title}</h2>
          <ul className={styles.navigationList}>
            {group.links.map((link) => (
              <li key={link.title}>
                <Link
                  href={link.href}
                  {...(link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
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
          <FooterLinks />

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
