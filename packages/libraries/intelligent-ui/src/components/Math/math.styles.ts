import { css } from "@openuidev/react-components";

export const names = {
  root: "openui-intelligent-math",
  block: "openui-intelligent-math--block",
} as const;

/** Its rules on .katex are not flat, because KaTeX renders that DOM. */
export const mathStyles = {
  root: css`
    font-variation-settings: normal;
    & .katex {
      font-size: 1.12em;
    }
  `,
  block: css`
    box-sizing: border-box;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 0;
    & .katex-display {
      margin: 0;
    }
  `,
};
