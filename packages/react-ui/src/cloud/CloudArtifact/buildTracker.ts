"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import { createContext, useContext, useSyncExternalStore } from "react";

/*
 * What a dashboard build has done, for the build feed: Thinking → the calls, by name → writing →
 * how it ended. The stream reports only its latest step, so the calls are kept here, per artifact,
 * from what every renderer of it sees. Two renderers of one dashboard (a card and a panel) show the
 * same feed; a step both see counts once.
 */

export type BuildPhase = "thinking" | "building" | "ready" | "stopped" | "failed";

/** A data tool the build called, or a script it saved, by the name the stream sent. */
export interface BuildCall {
  name: string;
  kind: "tool" | "script";
  /** Times it was called in the whole build. */
  count: number;
  /** The round it was last called in, from 1. The latest round runs until the next or the writing. */
  round: number;
}

export interface ArtifactBuild {
  /** A new version of a dashboard on screen, rather than a new dashboard. */
  edit: boolean;
  phase: BuildPhase;
  /** Oldest first. A name called again moves to the end. */
  calls: BuildCall[];
  rounds: number;
  /** When each round was seen (ms): a call took until the next round, the writing or the end. */
  roundAt: number[];
  writingAt?: number;
  endedAt?: number;
  /** Why it failed, as the stream said. */
  error?: string;
  /** Its stream has run: a stream that ends before the writing means it stopped. */
  connected: boolean;
}

/** What a renderer sees of its artifact, reported on every change. */
export interface BuildInput {
  step?: ArtifactBuildStep;
  hasContent: boolean;
  isStreaming: boolean;
  isPending: boolean;
  error: string | null;
}

const builds = new Map<string, ArtifactBuild>();
const seenSteps = new WeakSet<ArtifactBuildStep>();
const listeners = new Set<() => void>();

export const isBuildActive = (build: ArtifactBuild) =>
  build.phase === "thinking" || build.phase === "building";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** A build that has just begun: before its artifact has an id, the tool call that makes it runs. */
export const THINKING: ArtifactBuild = {
  edit: false,
  phase: "thinking",
  calls: [],
  rounds: 0,
  roundAt: [],
  connected: false,
};

/** Moves the artifact's build on from what a renderer sees. */
export function trackBuild(id: string, input: BuildInput): void {
  const now = Date.now();
  const { step } = input;
  const newStep = step !== undefined && !seenSteps.has(step);
  const current = builds.get(id);
  let build = current && isBuildActive(current) ? current : undefined;

  if (!build) {
    // A new dashboard is pending until it has content; an edit sends steps over the one on screen.
    const create = input.isPending && !input.hasContent;
    const edit = input.hasContent && newStep;
    if (!create && !edit) return;
    build = { ...THINKING, edit: !create };
  }

  if (newStep) {
    seenSteps.add(step);
    if (build.phase === "thinking") {
      const round = build.rounds + 1;
      const calls = [...build.calls];
      const add = (name: string, kind: BuildCall["kind"]) => {
        const index = calls.findIndex((call) => call.kind === kind && call.name === name);
        const [before] = index >= 0 ? calls.splice(index, 1) : [];
        const count = (before?.count ?? 0) + 1;
        calls.push({ name, kind, count, round });
      };
      step.tools.forEach((name) => add(name, "tool"));
      step.scripts.forEach((name) => add(name, "script"));
      build = { ...build, calls, rounds: round, roundAt: [...build.roundAt, now] };
    }
  }
  if (input.isStreaming && !build.connected) build = { ...build, connected: true };

  if (input.error) {
    build = { ...build, phase: "failed", endedAt: now, error: input.error };
  } else {
    // An edit keeps showing the version before it, so its writing starts when the step clears.
    const writing = build.edit ? build.rounds > 0 && !step && input.isStreaming : input.hasContent;
    if (writing && build.phase === "thinking") {
      build = { ...build, phase: "building", writingAt: now };
    }
    // The stream ended: saved once it was writing, else stopped before it wrote anything.
    if (!input.isStreaming && build.connected) {
      const phase = build.phase === "building" ? "ready" : "stopped";
      build = { ...build, phase, endedAt: now };
    }
  }

  if (build === current) return;
  builds.set(id, build);
  listeners.forEach((listener) => listener());
}

/** The artifact's latest build in this page, if anything built it here. */
export function useArtifactBuild(id: string | null): ArtifactBuild | undefined {
  return useSyncExternalStore(
    subscribe,
    () => (id ? builds.get(id) : undefined),
    () => undefined,
  );
}

/** The feed's build and the word for what's built, from the renderer root. */
export interface BuildFeedValue {
  build?: ArtifactBuild;
  /** "dashboard" for a live renderer. Without it, the feed says "Generating…" while it writes. */
  noun?: string;
}

export const BuildFeedContext = createContext<BuildFeedValue>({});

export const useBuildFeed = () => useContext(BuildFeedContext);

/** A step's names, as they are: "a", "a and b", or "a, b and 2 more". */
const nameList = (names: string[]) =>
  names.length <= 2 ? names.join(" and ") : `${names[0]}, ${names[1]} and ${names.length - 2} more`;

/**
 * What a step does, by name: calling data tools, else writing and testing scripts. Undefined for
 * a step that has neither yet: the build has started.
 */
export const stepWords = (step: Pick<ArtifactBuildStep, "tools" | "scripts">) =>
  step.tools.length > 0
    ? { verb: "Calling", names: nameList(step.tools) }
    : step.scripts.length > 0
      ? { verb: "Writing and testing", names: nameList(step.scripts) }
      : undefined;

/** The calls running now: the latest round's, until the writing starts. */
export const runningCalls = (build: ArtifactBuild) =>
  build.phase === "thinking" ? build.calls.filter((call) => call.round === build.rounds) : [];

/** How long a call took, in ms. Undefined while it runs. */
export function callTime(build: ArtifactBuild, call: BuildCall): number | undefined {
  const from = build.roundAt[call.round - 1];
  if (from === undefined) return undefined;
  const to = build.roundAt[call.round] ?? build.writingAt ?? build.endedAt;
  return to === undefined ? undefined : Math.max(0, to - from);
}
