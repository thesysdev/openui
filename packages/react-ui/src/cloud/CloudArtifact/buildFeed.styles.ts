import { css, keyframes } from "@openuidev/react-components";
import { typography } from "./cloudArtifact.styles";

const bodySmall = typography("openui-text-body-sm", "regular");
const bodySmallHeavy = typography("openui-text-body-sm-heavy", "medium");
const labelSmall = typography("openui-text-label-sm", "regular");

const shimmer = keyframes`
  from {
    -webkit-mask-position: 100% 0;
    mask-position: 100% 0;
  }
  to {
    -webkit-mask-position: 0% 0;
    mask-position: 0% 0;
  }
`;

const rowIn = keyframes`
  from {
    opacity: 0;
    translate: 0 -4px;
  }
`;

/** Stable class names, to target from your own CSS. */
export const feedNames = {
  feed: "openui-artifact-feed",
  line: "openui-artifact-feed-line",
  label: "openui-artifact-feed-label",
  detail: "openui-artifact-feed-detail",
  time: "openui-artifact-feed-time",
  reason: "openui-artifact-feed-reason",
  calls: "openui-artifact-feed-calls",
  call: "openui-artifact-feed-call",
  panel: "openui-artifact-feed-panel",
} as const;

export const feedStyles = {
  feed: css`
    min-width: 0;
    color: var(--openui-text-neutral-secondary);
  `,
  line: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: 20px;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: var(--openui-radius-s);
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    & > svg {
      flex-shrink: 0;
    }
  `,
  // With calls to show, the line opens them: a button that looks like text, above the card's own.
  toggle: css`
    position: relative;
    z-index: 1;
    cursor: pointer;
    &:focus-visible {
      outline: 2px solid var(--openui-interactive-accent-default);
      outline-offset: 2px;
    }
  `,
  // Whatever runs shimmers: a light band passes over it. A mask, so each part keeps its color.
  shimmer: css`
    -webkit-mask-image: linear-gradient(100deg, #000 38%, rgb(0 0 0 / 0.35) 50%, #000 62%);
    mask-image: linear-gradient(100deg, #000 38%, rgb(0 0 0 / 0.35) 50%, #000 62%);
    -webkit-mask-size: 300% 100%;
    mask-size: 300% 100%;
    animation: ${shimmer} 2s linear infinite;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
      -webkit-mask-image: none;
      mask-image: none;
    }
  `,
  words: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    min-width: 0;
  `,
  label: css`
    flex-shrink: 0;
    ${bodySmallHeavy}
    white-space: nowrap;
  `,
  // A running step names its calls in the label, which then may shrink and end in "…".
  labelShrinks: css`
    flex-shrink: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  live: css`
    color: var(--openui-text-neutral-primary);
  `,
  danger: css`
    color: var(--openui-text-danger-primary);
  `,
  detail: css`
    min-width: 0;
    overflow: hidden;
    ${bodySmall}
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  chevron: css`
    flex-shrink: 0;
    transition: rotate 0.15s ease-out;
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  chevronOpen: css`
    rotate: 90deg;
  `,
  time: css`
    flex-shrink: 0;
    margin-left: auto;
    padding-left: var(--openui-space-s);
    ${labelSmall}
    font-variant-numeric: tabular-nums;
  `,
  reason: css`
    margin: var(--openui-space-3xs) 0 0;
    ${labelSmall}
    overflow-wrap: anywhere;
  `,
  // Eases the list's height as it opens and grows.
  smooth: css`
    overflow: hidden;
    transition: height 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
  smoothInner: css`
    display: flow-root;
  `,
  calls: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xs);
    max-height: 300px;
    margin: 0;
    padding: var(--openui-space-xs) 0 0;
    overflow-y: auto;
    list-style: none;
  `,
  call: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    height: 20px;
    min-width: 0;
    animation: ${rowIn} 0.2s ease-out;
    & > svg {
      flex-shrink: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  repeat: css`
    flex-shrink: 0;
    ${labelSmall}
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  `,
  // The feed over the dashboard area, in a small floating card.
  panel: css`
    box-sizing: border-box;
    width: min(26rem, calc(100% - 2rem));
    padding: var(--openui-space-xs) var(--openui-space-m) var(--openui-space-xs)
      var(--openui-space-s);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-l);
    background: color-mix(in srgb, var(--openui-background) 95%, transparent);
    box-shadow: 0 8px 24px -12px rgb(0 0 0 / 0.25);
    backdrop-filter: blur(8px);
    pointer-events: auto;
  `,
  // Once the dashboard is on screen: at the bottom of the content, or of what's visible of it.
  dock: css`
    position: sticky;
    bottom: 0;
    z-index: 5;
    flex-shrink: 0;
    height: 0;
    margin-top: auto;
    pointer-events: none;
    & > * {
      position: absolute;
      bottom: var(--openui-space-m);
      left: 50%;
      translate: -50% 0;
    }
  `,
};
