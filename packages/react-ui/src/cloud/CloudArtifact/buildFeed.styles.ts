import { css, keyframes } from "@openuidev/react-components";
import { typography } from "./cloudArtifact.styles";

const bodySmall = typography("openui-text-body-sm", "regular");
const bodySmallHeavy = typography("openui-text-body-sm-heavy", "medium");

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

/** Stable class names, to target from your own CSS. */
export const feedNames = {
  feed: "openui-artifact-feed",
  label: "openui-artifact-feed-label",
  detail: "openui-artifact-feed-detail",
  panel: "openui-artifact-feed-panel",
} as const;

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

export const feedStyles = {
  line: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    min-width: 0;
    height: 20px;
    color: var(--openui-text-neutral-secondary);
    & > svg {
      flex-shrink: 0;
      color: var(--openui-text-neutral-primary);
    }
  `,
  // A light band passes over the words. A mask, so the label and the names keep their colors.
  shimmer: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    min-width: 0;
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
  label: css`
    flex-shrink: 0;
    ${bodySmallHeavy}
    color: var(--openui-text-neutral-primary);
    white-space: nowrap;
  `,
  detail: css`
    min-width: 0;
    overflow: hidden;
    ${bodySmall}
    text-overflow: ellipsis;
    white-space: nowrap;
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
  `,
  // Once the dashboard is on screen: an anchor at the bottom of the content, or of what's visible
  // of it. The feed sits above it, in the middle of what's visible, then at the bottom.
  dock: css`
    position: sticky;
    bottom: 0;
    z-index: 5;
    flex-shrink: 0;
    height: 0;
    margin-top: auto;
    pointer-events: none;
  `,
  dockSpot: css`
    position: absolute;
    right: 0;
    left: 0;
    display: flex;
    justify-content: center;
  `,
  dockSpotDown: css`
    bottom: var(--openui-space-m);
    translate: 0 0;
  `,
  // Moving down from the middle once the dashboard fills the top half.
  dockSpotMoving: css`
    transition:
      bottom 0.45s ${ease},
      translate 0.45s ${ease};
    @media (prefers-reduced-motion: reduce) {
      transition: none;
    }
  `,
};
