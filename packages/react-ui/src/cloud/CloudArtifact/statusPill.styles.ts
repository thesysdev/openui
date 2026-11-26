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

const appear = keyframes`
  from {
    opacity: 0;
    translate: 0 8px;
  }
  to {
    opacity: 1;
    translate: 0 0;
  }
`;

/** Stable class names, to target from your own CSS. */
export const feedNames = {
  feed: "openui-artifact-feed",
  label: "openui-artifact-feed-label",
  detail: "openui-artifact-feed-detail",
  panel: "openui-artifact-feed-panel",
} as const;

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
  // A small pill over the dashboard area, as wide as its words. In the page's own font, and in
  // the page's colors: system colors follow its color-scheme (light or dark), so it needs no
  // ThemeProvider of its own.
  panel: css`
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    max-width: calc(100% - 2rem);
    padding: var(--openui-space-xs) 12px;
    border: 1px solid color-mix(in srgb, CanvasText 12%, transparent);
    border-radius: var(--openui-radius-full);
    background: color-mix(in srgb, Canvas 95%, transparent);
    box-shadow:
      0 1px 3px 0 rgb(0 0 0 / 0.1),
      0 1px 2px -1px rgb(0 0 0 / 0.1);
    backdrop-filter: blur(8px);
    color: color-mix(in srgb, CanvasText 62%, transparent);
    font-family: inherit;
    font-size: 12px;
    line-height: 16px;
    & .${feedNames.feed} {
      gap: 6px;
      height: 16px;
      color: inherit;
    }
    & .${feedNames.feed} > svg {
      color: inherit;
    }
    & .${feedNames.label}, & .${feedNames.detail} {
      font: inherit;
      letter-spacing: normal;
      color: inherit;
    }
  `,
  // A marker in the content that takes no room: the capsule is placed from the content's box.
  dock: css`
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  `,
  // Over what's visible of the content, however the page scrolls; placed by script.
  dockSpot: css`
    position: fixed;
    z-index: 5;
    display: flex;
    justify-content: center;
    pointer-events: none;
  `,
  // Rises and fades in after a moment, so a quick load doesn't flash it.
  delayed: css`
    & > * {
      animation: ${appear} 0.2s ease-out 0.3s both;
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    }
  `,
};
