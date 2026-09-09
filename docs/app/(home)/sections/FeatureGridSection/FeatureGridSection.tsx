"use client";

import {
  ArrowUpRight,
  Broadcast,
  ChartLineUp,
  CloudArrowUp,
  CursorClick,
  Database,
  Devices,
  Handshake,
  Key,
  Plugs,
  Pulse,
  PuzzlePiece,
  ShieldCheck,
  type Icon,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { BevelButton } from "../../components/Button/BevelButton";
import { ExpandChevron } from "../../components/ExpandChevron";
import { useSingleOpenAccordion } from "../../components/MobileAccordion/useSingleOpenAccordion";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { CompatibilitySection } from "../CompatibilitySection/CompatibilitySection";
import styles from "./FeatureGridSection.module.css";

export type GridFeature = {
  Icon?: Icon;
  icon?: GridFeatureIcon;
  title: string;
  description: ReactNode;
};

const FEATURES: GridFeature[] = [
  {
    Icon: Plugs,
    title: "Live data",
    description:
      "Interfaces query your tools and MCP servers at runtime, so the data is always current.",
  },
  {
    Icon: Devices,
    title: "Cross-platform",
    description:
      "One response renders across React, Vue, Svelte, React Native, email, and script tags.",
  },
  {
    Icon: Broadcast,
    title: "Streaming-first",
    description: "UI renders progressively as the model responds, not after the full output.",
  },
  {
    Icon: CursorClick,
    title: "Interactive",
    description: "Generate UI that responds as users click, choose, and type.",
  },
  {
    Icon: ShieldCheck,
    title: "Safe by default",
    description: "The model only composes your components and never runs arbitrary code.",
  },
  {
    Icon: PuzzlePiece,
    title: "Bring your own components",
    description: "Build from the components and design system you already have.",
  },
];

const FEATURE_ICONS = {
  chart: ChartLineUp,
  cloud: CloudArrowUp,
  database: Database,
  devices: Devices,
  handshake: Handshake,
  interaction: CursorClick,
  key: Key,
  pulse: Pulse,
  shield: ShieldCheck,
  signal: Broadcast,
} as const;

export type GridFeatureIcon = keyof typeof FEATURE_ICONS;

export function FeatureGridSection({
  features = FEATURES,
  lead,
  showHeader = true,
  showHeaderSeparator = true,
  showCompat = true,
  compatFirst = false,
  gridFirst = false,
  header,
  showBottomSeparator = true,
  fadeColumnLines = false,
  showTopSeparator = false,
  flushOuterCards = false,
  flushSectionPadding = false,
  balanceLastRow = false,
  desktopColumns = 3,
  mobileAccordion = true,
}: {
  features?: GridFeature[];
  /** Optional content rendered as the first cell in the feature grid. */
  lead?: ReactNode;
  /** The benchmark header + CTA (OpenUI-specific). Off for sub-product pages. */
  showHeader?: boolean;
  /** The rule under that header. Off when there is no grid for it to divide. */
  showHeaderSeparator?: boolean;
  /** The "Works with your stack" compatibility band (OpenUI-specific). */
  showCompat?: boolean;
  /** Put that band above the header instead of below the grid. */
  compatFirst?: boolean;
  /** Render the feature grid above the benchmark header instead of below it. */
  gridFirst?: boolean;
  /** Custom headline above the grid (with a separator below it), e.g. a page tagline. */
  header?: ReactNode;
  /** The full-width separator at the very bottom of the section (default on). */
  showBottomSeparator?: boolean;
  /** Fade the grid's vertical column dividers out toward the bottom. */
  fadeColumnLines?: boolean;
  /** Show a full-width rule above the grid. */
  showTopSeparator?: boolean;
  /** Remove the outside padding from the edge cells in a two-row, three-column grid. */
  flushOuterCards?: boolean;
  /** Remove this section's page gutter when it is nested inside an already padded section. */
  flushSectionPadding?: boolean;
  /** Let the final two cards split the full grid width evenly. */
  balanceLastRow?: boolean;
  /** Number of columns used by the feature grid on desktop. */
  desktopColumns?: 3 | 4;
  /** Keep short, essential descriptions visible without tapping on mobile. */
  mobileAccordion?: boolean;
} = {}) {
  // Mobile-only: all rows collapsed by default; one expands at a time and the
  // open one can be tapped to collapse. Desktop ignores this (CSS shows all).
  const accordion = useSingleOpenAccordion();

  const compatBand = showCompat ? (
    <div className={styles.compat}>
      <CompatibilitySection embedded />
    </div>
  ) : null;

  const gridBlock = (
    <div
      className={`${styles.grid} ${fadeColumnLines ? styles.gridFadeLines : ""} ${
        features.length <= desktopColumns ? styles.gridSingleRow : ""
      } ${flushOuterCards ? styles.gridFlushOuterCards : ""} ${
        balanceLastRow ? styles.gridBalancedLastRow : ""
      } ${desktopColumns === 4 ? styles.gridFourColumns : ""}`.trim()}
    >
      {lead && <div className={styles.lead}>{lead}</div>}
      {features.map(({ Icon, icon, title, description }, index) => {
        const FeatureIcon = Icon ?? (icon ? FEATURE_ICONS[icon] : undefined);

        return (
          <div
            className={`${styles.feature} ${FeatureIcon ? "" : styles.featureWithPlaceholder}`.trim()}
            key={title}
            {...(mobileAccordion ? accordion.getToggleProps(index) : {})}
          >
            <span
              className={`${styles.icon} ${FeatureIcon ? "" : styles.iconPlaceholder}`.trim()}
              aria-hidden="true"
            >
              {FeatureIcon && <FeatureIcon size={28} weight="light" />}
            </span>
            <h3 className={styles.featureTitle}>{title}</h3>
            <ExpandChevron className={styles.chevron} />
            <p className={styles.featureDescription}>
              <span className={styles.featureDescriptionInner}>{description}</span>
            </p>
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      className={`${styles.section} ${flushSectionPadding ? styles.sectionFlushPadding : ""} ${!mobileAccordion ? styles.sectionStatic : ""}`.trim()}
    >
      {gridFirst && <div className={styles.gridLead}>{gridBlock}</div>}
      {compatFirst && compatBand && (
        /* No rule here: the space below the band separates it from the header,
           which reads quieter than a line across the page. */
        <div className={styles.compatLead}>{compatBand}</div>
      )}
      {showHeader && (
        <>
          <div className={styles.header}>
            <SectionHeader
              title="Renders 3x faster"
              subtitle="with 67% fewer tokens"
              caption="when compared to JSON based formats"
            >
              <div className={styles.ctaWrap}>
                <BevelButton
                  /* The format view, not the model board: this claim is about how OpenUI
                     compares with other formats, and the chart reads that param on load. */
                  href="/benchmarks?view=formats"
                  label="View benchmarks"
                  badge={<ArrowUpRight size={16} weight="bold" />}
                />
              </div>
            </SectionHeader>
          </div>
          {showHeaderSeparator && <div className={styles.separator} />}
        </>
      )}
      {header && (
        <>
          <p className={styles.taglineHeader}>{header}</p>
          <div className={styles.separator} />
        </>
      )}
      {showTopSeparator && <div className={styles.separator} />}
      {!gridFirst && gridBlock}
      {!compatFirst && compatBand && (
        <>
          <div className={styles.separator} />
          {compatBand}
        </>
      )}
      {showBottomSeparator && <div className={`${styles.separator} ${styles.separatorBottom}`} />}
    </section>
  );
}
