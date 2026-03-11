"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BUTTON_SHADOW } from "../shared/shared";
import styles from "./FeaturesSection.module.css";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Feature {
  title: string;
  description: string;
  iconPath: string;
}

const FEATURES: Feature[] = [
  {
    title: "Performance Optimized",
    description: "Up to 3.0x faster rendering than json-render",
    iconPath: svgPaths.p7658f00,
  },
  {
    title: "Token efficient",
    description: "Up to 67.1% lesser tokens than json-render",
    iconPath: svgPaths.p2a8ddd80,
  },
  {
    title: "Native Types",
    description: "Performant and memory safe",
    iconPath: svgPaths.p10e86100,
  },
  {
    title: "Works across platforms",
    description: "JS Runtime. Native support for iOS & Android coming soon",
    iconPath: svgPaths.p2cbb5d00,
  },
  {
    title: "Streaming Native",
    description: "Streaming and partial responses",
    iconPath: svgPaths.p33780400,
  },
  {
    title: "Interactive",
    description: "Handles inputs and interactive flows",
    iconPath: svgPaths.p17c7f700,
  },
  {
    title: "Safe by Default",
    description: "No arbitrary code execution",
    iconPath: svgPaths.p16eec200,
  },
];

const LAST_FEATURE_INDEX = FEATURES.length - 1;
const FEATURES_CTA_STYLE = {
  "--features-cta-shadow": BUTTON_SHADOW,
} as CSSProperties;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FeatureIcon({ path, index }: { path: string; index: number }) {
  const clipId = `clip_feat_${index}`;
  return (
    <div className={styles.featureIcon}>
      <svg className={styles.featureIconSvg} fill="none" viewBox="0 0 18 18">
        <g clipPath={`url(#${clipId})`}>
          <path d={path} fill="black" />
        </g>
        <defs>
          <clipPath id={clipId}>
            <rect fill="white" height="18" width="18" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function DesktopFeatureRow({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div className={styles.desktopRow}>
      <div className={styles.desktopRowLead}>
        <div>
          <FeatureIcon path={feature.iconPath} index={index} />
        </div>
        <span className={styles.desktopTitle}>
          {feature.title}
        </span>
      </div>
      <span className={styles.desktopDescription}>
        {feature.description}
      </span>
    </div>
  );
}

function MobileFeatureRow({ feature, index }: { feature: Feature; index: number }) {
  return (
    <div className={styles.mobileRow}>
      <div className={styles.mobileCopy}>
        <span className={styles.mobileTitle}>
          {feature.title}
        </span>
        <span className={styles.mobileDescription}>
          {feature.description}
        </span>
      </div>
      <div>
        <FeatureIcon path={feature.iconPath} index={index + FEATURES.length} />
      </div>
    </div>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return <div className={`${styles.divider} ${className}`} />;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FeaturesSection() {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        {/* Desktop */}
        <div className={styles.desktopList}>
          {FEATURES.map((f, i) => (
            <div key={f.title}>
              <DesktopFeatureRow feature={f} index={i} />
              {i < LAST_FEATURE_INDEX && <Divider className={styles.desktopDivider} />}
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className={styles.mobileList}>
          {FEATURES.map((f, i) => (
            <div key={f.title}>
              <MobileFeatureRow feature={f} index={i} />
              {i < LAST_FEATURE_INDEX && <Divider className={styles.mobileDivider} />}
            </div>
          ))}
        </div>

        {/* CTA button */}
        <div className={styles.ctaWrap}>
          <Link href="/docs/openui-lang/benchmarks" className={styles.ctaLink}>
            <span className={styles.ctaButton} style={FEATURES_CTA_STYLE}>
              <span className={styles.mobileLabel}>Detailed comparison</span>
              <span className={styles.desktopLabel}>View Comparison</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
