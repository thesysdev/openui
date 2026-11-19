import { css } from "../../styles/css";

export const names = {
  root: "openui-foldable-section",
  item: "openui-foldable-section-item",
  header: "openui-foldable-section-header",
  triggerContentWrapper: "openui-foldable-section-trigger-content-wrapper",
  triggerContentSeparator: "openui-foldable-section-trigger-content-separator",
  triggerContentIconButtonWrapper: "openui-foldable-section-trigger-content-icon-button-wrapper",
  triggerContentIconButton: "openui-foldable-section-trigger-content-icon-button",
  triggerContentIconButtonIcon: "openui-foldable-section-trigger-content-icon-button-icon",
  triggerContentText: "openui-foldable-section-trigger-content-text",
  trigger: "openui-foldable-section-trigger",
  content: "openui-foldable-section-content",
} as const;
export const foldableSectionStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-l, 18px);
  `,
  item: css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-l, 18px);
  `,
  header: css`
    display: flex;
    margin-block-start: 0;
    margin-block-end: 0;
    margin-inline-start: 0;
    margin-inline-end: 0;
  `,
  triggerContentWrapper: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-l, 18px);
    align-items: start;
    justify-content: center;
    width: 100%;
  `,
  triggerContentSeparator: css`
    margin: var(--openui-space-3xs, 2px);
  `,
  triggerContentIconButtonWrapper: css`
    display: flex;
    align-items: center;
    justify-content: start;
    gap: var(--openui-space-s, 8px);
    width: 100%;
  `,
  triggerContentIconButton: css`
    flex-shrink: 0;
  `,
  triggerContentIconButtonIcon: css`
    transition: transform 300ms cubic-bezier(0.87, 0, 0.13, 1);
    transform: var(--_openui-foldable-section-icon-transform);
  `,
  triggerContentText: css`
    font: var(--openui-text-heading-sm, 600 18px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-heading-sm-letter-spacing, -0.01em);
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: start;
    padding: 0;
    margin: 0;
  `,
  trigger: css`
    background-color: transparent;
    border: none;
    padding: var(--openui-space-m, 12px) 0 var(--openui-space-xs, 6px) 0;
    width: 100%;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    cursor: pointer;
    --_openui-foldable-section-icon-transform: none;
    &[data-state="open"] {
      --_openui-foldable-section-icon-transform: rotate(90deg);
    }
  `,
  content: css`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xl, 24px);
    padding: 0 0 0 28px;
    &[data-state="open"] {
      height: fit-content;
    }
    &[data-state="closed"] {
      height: 0;
    }
  `,
};
