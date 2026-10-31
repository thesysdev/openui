import { css } from "../../../../../styles/css";

import { iconButtonStyles } from "../../../../IconButton/iconButton.styles";

// IconButton registers on import. Reading its map keeps that value import, so its rules come
// before these equal-weight part rules, which register when this module is imported.
Object.values(iconButtonStyles);

export const names = {
  root: "openui-scroll-buttons-horizontal",
  button: "openui-scroll-buttons-horizontal-button",
  icon: "openui-scroll-buttons-horizontal-icon",
  left: "openui-scroll-buttons-horizontal-left",
  right: "openui-scroll-buttons-horizontal-right",
} as const;

export const scrollButtonsHorizontalStyles = {
  root: css`
    position: relative;
  `,
  button: css`
    position: absolute;
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    &:disabled {
      visibility: hidden;
      cursor: not-allowed;
      transition: visibility 0.1s linear;
    }
  `,
  left: css`
    top: -23px;
    transform: translateY(-50%);
    left: 20px;
  `,
  right: css`
    top: -23px;
    transform: translateY(-50%);
    right: 0px;
  `,
};
