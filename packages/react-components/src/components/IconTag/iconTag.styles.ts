import { css } from "../../styles/css";

export const names = {
  root: "openui-icon-tag",
  icon: "openui-icon-tag-icon",
  size: {
    xs: "openui-icon-tag--size-xs",
    s: "openui-icon-tag--size-s",
    m: "openui-icon-tag--size-m",
    l: "openui-icon-tag--size-l",
    xl: "openui-icon-tag--size-xl",
  },
  variant: {
    neutral: "openui-icon-tag--variant-neutral",
    info: "openui-icon-tag--variant-info",
    success: "openui-icon-tag--variant-success",
    warning: "openui-icon-tag--variant-warning",
    danger: "openui-icon-tag--variant-danger",
    inverted: "openui-icon-tag--variant-inverted",
  },
} as const;

export const iconTagStyles = {
  icon: css`
    width: var(--_openui-icon-tag-icon-size);
    height: var(--_openui-icon-tag-icon-size);
  `,
  root: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    flex-shrink: 0;
  `,
  size: {
    xs: css`
      width: 20px;
      height: 20px;
      border-radius: var(--openui-radius-xs, 4px);
      --_openui-icon-tag-icon-size: 12px;
    `,
    s: css`
      width: 24px;
      height: 24px;
      border-radius: var(--openui-radius-s, 6px);
      --_openui-icon-tag-icon-size: 14px;
    `,
    m: css`
      width: 32px;
      height: 32px;
      border-radius: var(--openui-radius-s, 6px);
      --_openui-icon-tag-icon-size: 14px;
    `,
    l: css`
      width: 36px;
      height: 36px;
      border-radius: var(--openui-radius-m, 8px);
      --_openui-icon-tag-icon-size: 16px;
    `,
    xl: css`
      width: 40px;
      height: 40px;
      border-radius: var(--openui-radius-m, 8px);
      --_openui-icon-tag-icon-size: 16px;
    `,
  },
  variant: {
    neutral: css`
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    `,
    info: css`
      background-color: var(--openui-info-background, oklch(0.623 0.188 259.815 / 0.12));
      color: var(--openui-text-info-primary, oklch(0.424 0.181 265.638 / 1));
    `,
    success: css`
      background-color: var(--openui-success-background, oklch(0.627 0.17 149.214 / 0.12));
      color: var(--openui-text-success-primary, oklch(0.448 0.108 151.328 / 1));
    `,
    warning: css`
      background-color: var(--openui-alert-background, oklch(0.795 0.162 86.047 / 0.16));
      color: var(--openui-text-alert-primary, oklch(0.476 0.103 61.907 / 1));
    `,
    danger: css`
      background-color: var(--openui-danger-background, oklch(0.577 0.215 27.325 / 0.12));
      color: var(--openui-text-danger-primary, oklch(0.505 0.19 27.518 / 1));
    `,
    inverted: css`
      background-color: var(--openui-inverted-background, oklch(0.097 0 0 / 1));
      color: var(--openui-background, oklch(0.97 0 89.876 / 1));
    `,
  },
};
