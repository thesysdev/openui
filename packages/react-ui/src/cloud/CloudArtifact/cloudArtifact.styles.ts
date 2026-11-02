import { css, keyframes } from "goober";

const typography = (token: string, variation: "regular" | "medium") => `
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
  error: "openui-artifact-error",
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
};
