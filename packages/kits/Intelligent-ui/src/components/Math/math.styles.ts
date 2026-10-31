import { css } from "goober";

export const names = { root: "openui-intelligent-math", block: "openui-intelligent-math--block" } as const;

/** Its rules on .katex are not flat, because KaTeX renders that DOM. */
export const styles = {
  root: css`
    & .katex {
      font-size: 1.12em;
    }
  `,
  block: css`
    overflow-x: auto;
    overflow-y: hidden;
    padding: 4px 0;
    & .katex-display {
      margin: 0;
    }
  `,
};
