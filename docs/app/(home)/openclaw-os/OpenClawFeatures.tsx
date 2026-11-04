"use client";

import {
  Bell,
  Eye,
  MagicWand,
  PushPin,
  SlidersHorizontal,
  SquaresFour,
} from "@phosphor-icons/react";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";

// OpenClaw OS product features, rendered through the home page's FeatureGridSection
// grid treatment (no benchmark header / compatibility band — those are OpenUI-specific).
const OPENCLAW_FEATURES: GridFeature[] = [
  {
    Icon: MagicWand,
    title: "Generative UI",
    description: "Build apps, dashboards, and artifacts on demand.",
  },
  {
    Icon: PushPin,
    title: "Persistent apps",
    description: "Apps stay in place and refresh with live data automatically.",
  },
  {
    Icon: SquaresFour,
    title: "Structured workspace",
    description: "Agents, sessions, artifacts, and apps in one organized space.",
  },
  {
    Icon: Eye,
    title: "Full visibility",
    description: "Inspect tool calls, context, and agent actions in real time.",
  },
  {
    Icon: SlidersHorizontal,
    title: "Direct control",
    description: "Permissions, schedules, and execution from one interface.",
  },
  {
    Icon: Bell,
    title: "Live notifications",
    description: "Stay updated with cron jobs and agent notifications.",
  },
];

export function OpenClawFeatures() {
  return (
    <FeatureGridSection
      features={OPENCLAW_FEATURES}
      showHeader={false}
      showCompat={false}
      header="A power-packed workspace for your OpenClaw agents, where you can generate apps for every use case."
      showBottomSeparator={false}
      fadeColumnLines
    />
  );
}
