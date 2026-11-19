import { css } from "goober";
import { typography } from "../CloudArtifact/cloudArtifact.styles";

/** Stable class names, to target from your own CSS. */
export const names = {
  card: "openui-artifact-card",
  cardBody: "openui-artifact-card-body",
  cardLabel: "openui-artifact-card-label",
  illustration: "openui-artifact-illustration",
} as const;

export const styles = {
  // Stacks off the card's own width: the chat column is often much narrower than the viewport.
  cardContainer: css`
    container-type: inline-size;
    margin-block-end: var(--openui-space-m-l);
  `,
  card: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-m-l);
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: var(--openui-space-l);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-4xl);
    cursor: pointer;
    transition: background-color 0.16s ease;
    &:hover {
      background-color: var(--openui-highlight-subtle);
    }
    @container (max-width: 420px) {
      flex-direction: column;
      align-items: flex-start;
    }
  `,
  cardBody: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: var(--openui-space-xs);
    min-width: 0;
    color: var(--openui-text-neutral-primary);
    overflow-wrap: anywhere;
    & > span:first-child {
      ${typography("openui-text-body-lg-heavy", "medium")}
    }
  `,
  cardLabel: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s);
    ${typography("openui-text-label-sm", "regular")}
    color: var(--openui-text-neutral-secondary);
  `,
  illustration: css`
    position: relative;
    align-self: flex-start;
    flex-shrink: 0;
    width: 64px;
    height: 52px;
    overflow: hidden;
    border-radius: var(--openui-radius-m);
    background-color: var(--openui-highlight);
  `,
  canvas: css`
    position: absolute;
    inset: var(--openui-space-s) 0 0 var(--openui-space-s);
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xs);
    padding: var(--openui-space-s) 0 0 var(--openui-space-s);
    overflow: hidden;
    border-radius: var(--openui-radius-s) 0 0 0;
    background-color: var(--openui-foreground);
    box-shadow: var(--openui-shadow-s);
  `,
  lines: css`
    display: flex;
    flex-shrink: 0;
    gap: var(--openui-space-2xs);
    & > span {
      height: 4px;
      border-radius: var(--openui-radius-2xs);
      background-color: var(--openui-text-purple-primary);
    }
    & > span:first-child {
      width: 24px;
      opacity: 0.8;
    }
    & > span:nth-child(2) {
      width: 10px;
      opacity: 0.2;
    }
  `,
  panels: css`
    display: flex;
    flex: 1;
    gap: var(--openui-space-xs);
    min-height: 0;
  `,
  panel: css`
    display: flex;
    align-items: flex-end;
    gap: var(--openui-space-2xs);
    width: 64px;
    padding: var(--openui-space-xs) var(--openui-space-xs) 0;
    overflow: hidden;
    border-radius: var(--openui-radius-xs) var(--openui-radius-xs) 0 0;
    background-color: var(--openui-purple-background);
    opacity: 0.64;
    & > span {
      flex: 0 0 4px;
      border-radius: var(--openui-radius-2xs) var(--openui-radius-2xs) 0 0;
      background-color: var(--openui-text-purple-primary);
      opacity: 0.1;
    }
    & > span:first-child {
      height: 12px;
    }
    & > span:nth-child(2) {
      height: 20px;
      opacity: 0.3;
    }
    & > span:nth-child(3) {
      height: 16px;
    }
  `,
  panelBleed: css`
    flex-shrink: 0;
    width: 44px;
    margin-right: -34px;
    padding: 0;
    opacity: 0.46;
  `,
};
