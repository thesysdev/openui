import { css } from "../../styles/css";

export const names = {
  root: "openui-text-content-wrapper",
  markdown: "openui-text-content-wrapper-markdown",
  math: "openui-text-content-wrapper-math",
  variant: {
    clear: "openui-text-content-wrapper--variant-clear",
    card: "openui-text-content-wrapper--variant-card",
    sunk: "openui-text-content-wrapper--variant-sunk",
  },
} as const;
export const textContentWrapperStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-xl, 24px);
    --_openui-text-content-wrapper-math-display: inline;
    --_openui-text-content-wrapper-math-margin: 0px;
    &[data-mode="dark"] {
      --_openui-text-content-wrapper-math-display: inline-block;
      --_openui-text-content-wrapper-math-margin: var(--openui-space-xs, 6px);
    }
  `,
  math: css`
    display: var(--_openui-text-content-wrapper-math-display);
    margin-top: var(--_openui-text-content-wrapper-math-margin);
  `,
};
