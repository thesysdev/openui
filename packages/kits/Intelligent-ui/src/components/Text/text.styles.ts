import { css } from "goober";

export const names = {
  root: "openui-intelligent-text",
  inline: "openui-intelligent-text-inline",
  size: {
    default: "openui-intelligent-text--size-default",
    xs: "openui-intelligent-text--size-xs",
    sm: "openui-intelligent-text--size-sm",
    md: "openui-intelligent-text--size-md",
    lg: "openui-intelligent-text--size-lg",
  },
  weight: {
    normal: "openui-intelligent-text--weight-normal",
    medium: "openui-intelligent-text--weight-medium",
    semibold: "openui-intelligent-text--weight-semibold",
  },
  clamp: "openui-intelligent-text--clamp",
} as const;

export const styles = {
  root: css`
    --_openui-intelligent-strong-weight: 640;
    margin: 0;
    overflow-wrap: anywhere;
    line-height: 1.6;
    white-space: pre-line;
  `,
  /* A component in a line of text; a Badge there is the model's child, so that rule is not flat. */
  inline: css`
    display: inline-flex;
    vertical-align: -0.15em;
    margin: 0 1px;
    & > .openui-intelligent-badge {
      vertical-align: 0.1em;
    }
  `,
  size: {
    xs: css`
      font-size: 12px;
      line-height: 1.6;
    `,
    sm: css`
      font-size: 14px;
      line-height: 1.55;
    `,
    md: css`
      font-size: 16px;
      line-height: 1.6;
    `,
    lg: css`
      font-size: 18px;
      line-height: 1.55;
    `,
  },
  weight: {
    normal: css`
      font-weight: 440;
    `,
    medium: css`
      font-weight: 560;
    `,
    semibold: css`
      font-weight: 640;
    `,
  },
  clamp: css`
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  `,
};
