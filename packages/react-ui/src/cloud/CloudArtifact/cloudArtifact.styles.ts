import { css, keyframes } from "@openuidev/react-components";

export const typography = (token: string, variation: "regular" | "medium") => `
  font: var(--${token});
  letter-spacing: var(--${token}-letter-spacing);
  font-variation-settings: var(--openui-font-variation-${variation});
`;
const bodyHeavy = typography("openui-text-body-default-heavy", "medium");
const bodySmall = typography("openui-text-body-sm", "regular");
const labelSmall = typography("openui-text-label-sm", "regular");

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const shimmer = keyframes`
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0% 0;
  }
`;

/** Stable class names, to target from your own CSS. */
export const names = {
  root: "openui-artifact",
  preview: "openui-artifact-preview",
  previewText: "openui-artifact-preview-text",
  previewTitle: "openui-artifact-preview-title",
  previewDescription: "openui-artifact-preview-description",
  previewError: "openui-artifact-preview-error",
  loader: "openui-artifact-loader",
  loaderText: "openui-artifact-loader-text",
  spinner: "openui-artifact-spinner",
  edited: "openui-artifact-edited",
  chrome: "openui-artifact-chrome",
  chromeBar: "openui-artifact-chrome-bar",
  chromeTitle: "openui-artifact-chrome-title",
  chromeActions: "openui-artifact-chrome-actions",
  close: "openui-artifact-close",
  content: "openui-artifact-content",
  loading: "openui-artifact-loading",
  pending: "openui-artifact-pending",
  error: "openui-artifact-error",
  errorEmpty: "openui-artifact-error-empty",
  panel: "openui-artifact-panel",
  inspecting: "openui-artifact-inspecting",
  provenanceToggle: "openui-artifact-provenance-toggle",
} as const;

export const styles = {
  root: css`
    position: relative;
  `,
  // A build's feed wraps onto its own line under the title; a loader pill stays beside it.
  preview: css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-xs) var(--openui-space-s);
    box-sizing: border-box;
    width: 100%;
    margin: var(--openui-space-xs) 0;
    padding: var(--openui-space-s) var(--openui-space-m);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-m);
    background: transparent;
    color: var(--openui-text-neutral-primary);
    text-align: left;
    cursor: pointer;
    transition: background-color 0.12s ease;
    &:hover {
      background: var(--openui-elevated-light);
    }
  `,
  previewFeed: css`
    flex-basis: 100%;
  `,
  previewText: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs);
    min-width: 0;
  `,
  previewTitle: css`
    ${bodyHeavy}
  `,
  previewDescription: css`
    ${bodySmall}
    color: var(--openui-text-neutral-secondary);
  `,
  // A status can name several tools, so it may shrink, up to 60%, and ends in "…" past that.
  loader: css`
    display: inline-flex;
    flex-shrink: 1;
    align-items: center;
    gap: var(--openui-space-2xs);
    min-width: 0;
    max-width: 60%;
    ${labelSmall}
    color: var(--openui-text-neutral-secondary);
    & > svg {
      flex-shrink: 0;
    }
  `,
  loaderText: css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  // The preview card's status as a pill, in the theme's colors (as Tag's `info` and `danger`).
  pill: css`
    box-sizing: border-box;
    height: 24px;
    padding: 0 var(--openui-space-xs);
    border-radius: var(--openui-radius-full);
  `,
  pillInfo: css`
    background: var(--openui-info-background);
    color: var(--openui-text-info-primary);
  `,
  pillDanger: css`
    background: var(--openui-danger-background);
    color: var(--openui-text-danger-primary);
  `,
  spinner: css`
    animation: ${spin} 0.9s linear infinite;
  `,
  // A brighter band sweeps across dimmed text. The fill is transparent, not the color, so
  // `currentColor` in the gradient stays the loader's text color.
  shimmer: css`
    background: linear-gradient(
        90deg,
        color-mix(in srgb, currentColor 45%, transparent) 35%,
        currentColor 50%,
        color-mix(in srgb, currentColor 45%, transparent) 65%
      )
      0 0 / 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shimmer} 2s linear infinite;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
      background: none;
      -webkit-text-fill-color: currentColor;
    }
  `,
  chrome: css`
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    color: var(--openui-text-neutral-primary);
  `,
  chromeBar: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s);
    padding: var(--openui-space-xs) var(--openui-space-m);
    border-bottom: 1px solid var(--openui-border-default);
  `,
  chromeTitle: css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${bodyHeavy}
  `,
  chromeActions: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-xs);
  `,
  // Inspect mode: what a click would select is outlined under the mouse. Before `content`,
  // so the selected outline, declared later with the same specificity, wins on both. Rules
  // in `:where()` count for nothing, so an app's own rule overrides them (see the docs). The
  // `--openui-inspect-*` variables, set on any element around the content, restyle them.
  inspecting: css`
    & :where([data-openui-hover]) {
      cursor: pointer;
      outline: var(
        --openui-inspect-hover-outline,
        1px dashed var(--openui-inspect-color, var(--openui-interactive-accent-default))
      );
      outline-offset: var(--openui-inspect-outline-offset, -2px);
    }
  `,
  content: css`
    position: relative;
    flex: 1;
    min-height: 120px;
    overflow: auto;
    /* Drawn inside the element: a tile in a strip that hides overflow keeps all four sides. */
    & :where([data-openui-selected]) {
      outline: var(
        --openui-inspect-selected-outline,
        2px solid var(--openui-inspect-color, var(--openui-interactive-accent-default))
      );
      outline-offset: var(--openui-inspect-outline-offset, -2px);
    }
  `,
  // The content's full width. A long message wraps, so it never pushes past the edge.
  error: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s);
    box-sizing: border-box;
    margin: var(--openui-space-s);
    padding: var(--openui-space-s) var(--openui-space-m);
    border: 1px solid var(--openui-border-danger);
    border-radius: var(--openui-radius-m);
    background: var(--openui-danger-background);
    ${bodySmall}
    & > span {
      min-width: 0;
      overflow-wrap: anywhere;
    }
    & > button {
      flex-shrink: 0;
    }
  `,
  errorEmpty: css`
    position: absolute;
    inset: 0;
    width: fit-content;
    max-width: calc(100% - 2 * var(--openui-space-l));
    height: fit-content;
    margin: auto;
  `,
  panel: css`
    padding: var(--openui-space-l) var(--openui-space-xl);
  `,
};
