"use client";

import { analytics, loadPostHog } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { AgentPicker } from "./AgentPicker";

const EXPERIMENT_FLAG = "homepage-agent-setup";
const SKILLS_ADD_COMMAND = "npx skills add thesysdev/skills";

const setupPrompt = (version: string) =>
  `Set up my first Generative UI agent by following https://www.openui.com/${version}/SKILL.md`;

const ARMS = {
  control: { label: "Setup for agents", command: setupPrompt("v1"), kind: "prompt" },
  "skills-add": { label: SKILLS_ADD_COMMAND, command: SKILLS_ADD_COMMAND, kind: "command" },
  "copy-prompt": { label: "Copy prompt", command: setupPrompt("v2"), kind: "prompt" },
} as const;

type Arm = keyof typeof ARMS;

const isArm = (value: unknown): value is Arm => typeof value === "string" && value in ARMS;

export function HomeAgentSetup() {
  const [arm, setArm] = useState<Arm | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void loadPostHog()
      .then((posthog) => {
        if (cancelled) return;
        unsubscribe = posthog.onFeatureFlags(() => {
          const variant = posthog.getFeatureFlag(EXPERIMENT_FLAG);
          setArm(isArm(variant) ? variant : "control");
        });
      })
      .catch(() => setArm("control"));
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const { label, command, kind } = ARMS[arm ?? "control"];
  return (
    <AgentPicker
      command={command}
      label={label}
      kind={kind}
      pending={!arm}
      onCopy={() => analytics.capture("agent_setup_copied")}
    />
  );
}
