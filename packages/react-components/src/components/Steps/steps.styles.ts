import { css } from "../../styles/css";

export const names = {
  root: "openui-steps",
  list: "openui-steps-list",
  item: "openui-steps-item",
  connector: "openui-steps-connector",
  number: "openui-steps-number",
  numberInner: "openui-steps-number-inner",
  connectorLine: "openui-steps-connector-line",
  content: "openui-steps-content",
  title: "openui-steps-title",
  details: "openui-steps-details",
} as const;
export const stepsStyles = {
  root: css`
    min-width: 280px;
    width: 100%;
    margin: 0 auto;
  `,
  list: css`
    display: flex;
    flex-direction: column;
  `,
  item: css`
    display: flex;
    position: relative;
    gap: var(--openui-space-m, 12px);
    /* Legacy typography(title, default) emits no declarations; retain inherited text. */
    --_openui-steps-line-display: block;
    --_openui-steps-content-margin: var(--openui-space-l, 18px);
    &:last-child {
      --_openui-steps-line-display: none;
      --_openui-steps-content-margin: 0;
    }
  `,
  connector: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
  number: css`
    padding: var(--openui-space-2xs, 4px) 0px var(--openui-space-2xs, 4px) 0px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  `,
  numberInner: css`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--openui-elevated, oklch(0.097 0 0 / 0.08));
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    box-sizing: border-box;
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  connectorLine: css`
    width: 1px;
    flex-grow: 1;
    z-index: 1;
    background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    display: var(--_openui-steps-line-display, block);
  `,
  content: css`
    padding-top: var(--openui-space-2xs, 4px);
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs, 2px);
    margin-bottom: var(--_openui-steps-content-margin, var(--openui-space-l, 18px));
  `,
  title: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  details: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--openui-space-m, 12px) + 2px);
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
};
