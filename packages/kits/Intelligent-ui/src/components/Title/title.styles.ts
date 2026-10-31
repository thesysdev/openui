import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-title",
  size: {
    sm: "openui-intelligent-title--size-sm",
    md: "openui-intelligent-title--size-md",
    lg: "openui-intelligent-title--size-lg",
    xl: "openui-intelligent-title--size-xl",
    "2xl": "openui-intelligent-title--size-2xl",
    "3xl": "openui-intelligent-title--size-3xl",
  },
} as const;

export const styles = {
  root: css`
    color: ${tokens.ink};
    font-weight: 640;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  `,
  size: {
    sm: css`
      font-size: 15px;
      line-height: 1.5;
    `,
    md: css`
      font-size: 17px;
      line-height: 1.4;
      letter-spacing: -0.2px;
    `,
    lg: css`
      font-size: 21px;
      line-height: 1.3;
      letter-spacing: -0.55px;
      @media (max-width: 640px) {
        font-size: 19px;
      }
    `,
    xl: css`
      font-size: 25px;
      line-height: 1.2;
      letter-spacing: -0.8px;
    `,
    "2xl": css`
      font-size: 32px;
      line-height: 1.15;
      letter-spacing: -1px;
      @media (max-width: 640px) {
        font-size: 28px;
      }
    `,
    "3xl": css`
      font-size: 40px;
      line-height: 1.1;
      letter-spacing: -1.4px;
      @media (max-width: 640px) {
        font-size: 34px;
      }
    `,
  },
};
