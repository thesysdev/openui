import { css } from "../../styles/css";

/** TabsContent's stable classes. */
export const names = {
  root: "openui-tabs-content",
  inner: "openui-tabs-content-inner",
} as const;

export const tabsContentStyles = {
  root: css`
    box-sizing: border-box;
    padding: var(--openui-space-3xs, 2px) 0;
    border: transparent;
    border-radius: var(--openui-radius-m, 8px);
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
  inner: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-l, 18px);
  `,
};
