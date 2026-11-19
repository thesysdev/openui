import { css } from "../../styles/css";

export const names = {
  root: "openui-list-block",
  size: { default: "openui-list-block--size-default", small: "openui-list-block--size-small" },
  variant: {
    number: "openui-list-block--variant-number",
    icon: "openui-list-block--variant-icon",
    image: "openui-list-block--variant-image",
  },
} as const;
export const listBlockStyles = {
  root: css`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: var(--_openui-list-block-gap);
  `,
  size: {
    default: css`
      --_openui-list-block-gap: var(--openui-space-l, 18px);
    `,
    small: css`
      --_openui-list-block-gap: var(--openui-space-m, 12px);
    `,
  },
};
