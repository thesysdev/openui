import type { Observability } from "@openuidev/observability";

/**
 * Mutable slot filled by `mountOpenUIDevtools()` before the widget's module
 * graph is loaded. The browser build has no bundler to resolve `react` /
 * `react-dom` against — the host's copies are injected here instead, and the
 * `browser-shims/*` modules that stand in for those bare specifiers read
 * from this slot.
 */
export interface Slot {
  react?: typeof import("react");
  reactDOM?: typeof import("react-dom");
  bus?: Observability;
  loadReactLang?: () => Promise<unknown>;
}

export const slot: Slot = {};

export function requireReact(): typeof import("react") {
  if (!slot.react) {
    throw new Error(
      "[@openuidev/devtools] the widget module loaded before mountOpenUIDevtools() ran — this is a bug in the browser build, not host code.",
    );
  }
  return slot.react;
}

export function requireReactDOM(): typeof import("react-dom") {
  if (!slot.reactDOM) {
    throw new Error(
      "[@openuidev/devtools] the widget module loaded before mountOpenUIDevtools() ran — this is a bug in the browser build, not host code.",
    );
  }
  return slot.reactDOM;
}

export function requireLoadReactLang(): () => Promise<unknown> {
  if (!slot.loadReactLang) {
    throw new Error(
      "[@openuidev/devtools] the widget module loaded before mountOpenUIDevtools() ran — this is a bug in the browser build, not host code.",
    );
  }
  return slot.loadReactLang;
}
