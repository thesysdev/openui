"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { FeatureList, type FeatureListItem } from "../../components/FeatureList/FeatureList";
import styles from "./FeaturesSection.module.css";

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
    title: "Live data",
    description: "Query your tools and MCP servers at runtime",
    icon: <SvgPathIcon path={svgPaths.p10e86100} index={0} />,
  },
  {
    title: "Works across platforms",
    description: "React, React Native, Vue, etc",
    icon: <SvgPathIcon path={svgPaths.p2cbb5d00} index={1} />,
  },
  {
    title: "Native Streaming",
    description: "UI renders in real time",
    icon: <SvgPathIcon path={svgPaths.p33780400} index={2} />,
  },
  {
    title: "Interactive",
    description: "Reactive state, inputs, and tool-connected actions",
    icon: <SvgPathIcon path={svgPaths.p17c7f700} index={3} />,
  },
  {
    title: "Safe by Default",
    description: "No arbitrary code execution",
    icon: <SvgPathIcon path={svgPaths.p16eec200} index={4} />,
  },
];

export function FeaturesSection({
  features = DEFAULT_FEATURES,
}: {
  features?: FeatureListItem[];
} = {}) {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <FeatureList items={features} />
      </div>
    </div>
  );
}
