import { css } from "../../../../../styles/css";

import { iconButtonStyles } from "../../../../IconButton/iconButton.styles";

// IconButton registers on import. Reading its map keeps that value import, so its rules come
// before these equal-weight part rules, which register when this module is imported.
Object.values(iconButtonStyles);

export const names = {
  root: "openui-scroll-buttons-vertical",
  button: "openui-scroll-buttons-vertical-button",
  icon: "openui-scroll-buttons-vertical-icon",
  up: "openui-scroll-buttons-vertical-up",
  down: "openui-scroll-buttons-vertical-down",
} as const;

export const scrollButtonsVerticalStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 36px;
    height: calc(100% - 44px);
    flex-shrink: 0;
    padding-left: var(--openui-space-2xs, 4px);
  `,
  button: css`
    pointer-events: auto;
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    &:disabled {
      visibility: hidden;
      cursor: not-allowed;
      transition: visibility 0.1s linear;
    }
  `,
};
