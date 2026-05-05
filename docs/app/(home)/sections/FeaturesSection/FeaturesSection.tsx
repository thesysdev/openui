"use client";

import {
  Browsers,
  Eye,
  MagicWand,
  PushPin,
  SlidersHorizontal,
  SquaresFour,
} from "@phosphor-icons/react";
import svgPaths from "@/imports/svg-urruvoh2be";
import { PillLink } from "../../components/Button/Button";
import { FeatureList, type FeatureListItem } from "../../components/FeatureList/FeatureList";
import styles from "./FeaturesSection.module.css";

const PHOSPHOR_ICON_SIZE = 18;

function SvgPathIcon({ path, index }: { path: string; index: number }) {
  const clipId = `clip_feat_${index}`;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath={`url(#${clipId})`}>
        <path d={path} fill="currentColor" />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect fill="white" height="18" width="18" />
        </clipPath>
      </defs>
    </svg>
  );
}

const DEFAULT_FEATURES: FeatureListItem[] = [
  {
    title: "Performance Optimized",
    description: "3x faster rendering than json-render",
    icon: <SvgPathIcon path={svgPaths.p7658f00} index={0} />,
  },
  {
    title: "Token efficient",
    description: "Up to 67.1% lesser tokens than json-render",
    icon: <SvgPathIcon path={svgPaths.p2a8ddd80} index={1} />,
  },
  {
    title: "Live data",
    description: "Query your tools and MCP servers at runtime",
    icon: <SvgPathIcon path={svgPaths.p10e86100} index={2} />,
  },
  {
    title: "Works across platforms",
    description: "React, React Native, Vue, etc",
    icon: <SvgPathIcon path={svgPaths.p2cbb5d00} index={3} />,
  },
  {
    title: "Native Streaming",
    description: "UI renders in real time",
    icon: <SvgPathIcon path={svgPaths.p33780400} index={4} />,
  },
  {
    title: "Interactive",
    description: "Reactive state, inputs, and tool-connected actions",
    icon: <SvgPathIcon path={svgPaths.p17c7f700} index={5} />,
  },
  {
    title: "Safe by Default",
    description: "No arbitrary code execution",
    icon: <SvgPathIcon path={svgPaths.p16eec200} index={6} />,
  },
];

export const OPENCLAW_FEATURES: FeatureListItem[] = [
  {
    title: "Generative UI",
    description: "Build apps, dashboards, and artifacts on demand",
    icon: <MagicWand size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Persistent apps",
    description: "Apps stay in place and refresh with live data automatically",
    icon: <PushPin size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Structured workspace",
    description: "Agents, sessions, artifacts, and apps in one organized space",
    icon: <SquaresFour size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Full visibility",
    description: "Inspect tool calls, context, and agent actions in real time",
    icon: <Eye size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Direct control",
    description: "Permissions, schedules, and execution from one interface",
    icon: <SlidersHorizontal size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
  {
    title: "Elegant interface",
    description: "Built for clarity with responsive layouts and themes",
    icon: <Browsers size={PHOSPHOR_ICON_SIZE} weight="fill" />,
  },
];

export function FeaturesSection({
  features = DEFAULT_FEATURES,
  showCta = true,
}: {
  features?: FeatureListItem[];
  showCta?: boolean;
} = {}) {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <FeatureList items={features} />

        {showCta && (
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
        )}
      </div>
    </div>
  );
}
