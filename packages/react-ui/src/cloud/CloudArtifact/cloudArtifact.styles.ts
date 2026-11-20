import { css, keyframes } from "goober";

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

/** Stable class names, to target from your own CSS. */
export const names = {
  root: "openui-artifact",
  preview: "openui-artifact-preview",
  previewText: "openui-artifact-preview-text",
  previewTitle: "openui-artifact-preview-title",
  previewDescription: "openui-artifact-preview-description",
  loader: "openui-artifact-loader",
  spinner: "openui-artifact-spinner",
  chrome: "openui-artifact-chrome",
  chromeBar: "openui-artifact-chrome-bar",
  chromeTitle: "openui-artifact-chrome-title",
  chromeActions: "openui-artifact-chrome-actions",
  close: "openui-artifact-close",
  content: "openui-artifact-content",
  loading: "openui-artifact-loading",
  loadingEmpty: "openui-artifact-loading-empty",
  pending: "openui-artifact-pending",
  error: "openui-artifact-error",
  panel: "openui-artifact-panel",
  inspecting: "openui-artifact-inspecting",
  provenanceToggle: "openui-artifact-provenance-toggle",
  provenancePanel: "openui-artifact-provenance",
} as const;

export const styles = {
  root: css`
    position: relative;
  `,
  preview: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s);
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
  loader: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--openui-space-2xs);
    ${labelSmall}
    color: var(--openui-text-neutral-secondary);
  `,
  spinner: css`
    animation: ${spin} 0.9s linear infinite;
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
  content: css`
    position: relative;
    flex: 1;
    min-height: 120px;
    overflow: auto;
    // Drawn inside the element: a tile in a strip that hides overflow keeps all four sides.
    & [data-openui-selected] {
      outline: 2px solid var(--openui-interactive-accent-default);
      outline-offset: -2px;
    }
  `,
  loading: css`
    position: absolute;
    top: var(--openui-space-xs);
    right: var(--openui-space-xs);
    display: inline-flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    padding: var(--openui-space-3xs) var(--openui-space-s);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-full);
    background: var(--openui-background);
    box-shadow: var(--openui-shadow-s);
    ${labelSmall}
    color: var(--openui-text-neutral-secondary);
  `,
  // Nothing to show yet: center the loader in the empty content.
  loadingEmpty: css`
    inset: 0;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  `,
  error: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s);
    margin: var(--openui-space-s);
    padding: var(--openui-space-s) var(--openui-space-m);
    border: 1px solid var(--openui-border-danger);
    border-radius: var(--openui-radius-m);
    background: var(--openui-danger-background);
    ${bodySmall}
  `,
  panel: css`
    padding: var(--openui-space-l) var(--openui-space-xl);
  `,
  // Inspect mode: components marked with bindSource show where a click lands.
  inspecting: css`
    & [data-openui-source] {
      cursor: pointer;
    }
    & [data-openui-source]:hover {
      outline: 1px dashed var(--openui-interactive-accent-default);
      outline-offset: -2px;
    }
  `,
  // A zero-height row that sticks to the top of the scrolling content, so the panel stays in
  // view and above the artifact's own sticky parts.
  provenanceDock: css`
    position: sticky;
    top: 0;
    z-index: 10;
    height: 0;
  `,
  provenancePanel: css`
    position: absolute;
    top: var(--openui-space-xs);
    right: var(--openui-space-xs);
    box-sizing: border-box;
    width: min(360px, calc(100% - 2 * var(--openui-space-xs)));
    max-height: min(640px, 80vh);
    overflow: auto;
    padding: var(--openui-space-s) var(--openui-space-m);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    box-shadow: var(--openui-shadow-m, var(--openui-shadow-s));
    color: var(--openui-text-neutral-primary);
  `,
  provenanceHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s);
  `,
  provenanceTitle: css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${bodyHeavy}
  `,
  provenanceSection: css`
    margin-top: var(--openui-space-s);
    padding-top: var(--openui-space-s);
    border-top: 1px solid var(--openui-border-default);
  `,
  provenanceLabel: css`
    ${bodyHeavy}
  `,
  provenanceNote: css`
    margin: 0;
    ${bodySmall}
    color: var(--openui-text-neutral-secondary);
  `,
  provenanceTableWrap: css`
    max-height: 220px;
    margin-top: var(--openui-space-2xs);
    overflow: auto;
  `,
  provenanceTable: css`
    border-collapse: collapse;
    ${bodySmall}
    & th,
    & td {
      padding: 2px var(--openui-space-xs);
      border-bottom: 1px solid var(--openui-border-default);
      text-align: left;
      white-space: nowrap;
    }
    & th {
      color: var(--openui-text-neutral-secondary);
    }
    & td[data-cited] {
      outline: 2px solid var(--openui-interactive-accent-default);
      outline-offset: -2px;
      font-weight: 600;
    }
  `,
  provenanceCode: css`
    max-height: 200px;
    margin: var(--openui-space-2xs) 0 0;
    overflow: auto;
    padding: var(--openui-space-xs);
    border-radius: var(--openui-radius-s);
    background: var(--openui-sunk, rgba(127, 127, 127, 0.08));
    font:
      12px/1.4 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    white-space: pre-wrap;
    word-break: break-word;
  `,
};
