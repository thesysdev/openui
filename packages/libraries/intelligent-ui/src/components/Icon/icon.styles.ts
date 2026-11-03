import { css } from "@openuidev/react-components";

export const names = {
  root: "openui-intelligent-icon",
  glyph: "openui-intelligent-icon-glyph",
} as const;

export const iconStyles = {
  root: css`
    font-variation-settings: normal;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    line-height: 0;
  `,
  /**
   * Every kit icon, in Button, IconButton and Badge too, keeps the source app's 1.8 stroke. A class
   * outweighs the `:where()` svg rules react-components' parts give the icons inside them.
   */
  glyph: css`
    stroke-width: 1.8;
    flex: none;
  `,
};
