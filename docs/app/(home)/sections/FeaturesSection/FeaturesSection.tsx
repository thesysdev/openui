"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { PillLink } from "../../components/Button/Button";
import { FeatureList, type FeatureListItem } from "../../components/FeatureList/FeatureList";
import styles from "./FeaturesSection.module.css";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const FEATURES: FeatureListItem[] = [
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FeaturesSection() {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <FeatureList items={FEATURES} />

        {/* CTA button */}
        <div className={styles.ctaWrap}>
          <PillLink
            href="/docs/openui-lang/benchmarks"
            className={`${styles.ctaLink} ${styles.ctaButton}`}
          >
            <span>
              <span className={styles.mobileLabel}>Detailed comparison</span>
              <span className={styles.desktopLabel}>View Comparison</span>
            </span>
          </PillLink>
        </div>
      </div>
    </div>
  );
}
