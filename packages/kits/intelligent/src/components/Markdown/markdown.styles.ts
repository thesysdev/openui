import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-markdown",
  strong: "openui-intelligent-markdown-strong",
  code: "openui-intelligent-markdown-code",
  block: "openui-intelligent-markdown-block",
  heading: "openui-intelligent-markdown-heading",
  headingLevel: {
    1: "openui-intelligent-markdown-heading--level-1",
    2: "openui-intelligent-markdown-heading--level-2",
    3: "openui-intelligent-markdown-heading--level-3",
    4: "openui-intelligent-markdown-heading--level-4",
  },
  list: "openui-intelligent-markdown-list",
  listItem: "openui-intelligent-markdown-list-item",
  quote: "openui-intelligent-markdown-quote",
  codeBlock: "openui-intelligent-markdown-code-block",
  rule: "openui-intelligent-markdown-rule",
  tableScroll: "openui-intelligent-markdown-table-scroll",
  table: "openui-intelligent-markdown-table",
  headCell: "openui-intelligent-markdown-head-cell",
  row: "openui-intelligent-markdown-row",
  cell: "openui-intelligent-markdown-cell",
} as const;

const GAP = "--_openui-intelligent-markdown-gap";
const CELL_BORDER = "--_openui-intelligent-markdown-cell-border";

/**
 * A ChatGPT-like rhythm: paragraphs 16/1.65 with 12px between blocks, more air above a heading than
 * below it, lists tucked under their lead-in. The renderer picks each block's gap from its neighbour.
 */
export const styles = {
  root: css`
    --_openui-intelligent-strong-weight: 640;
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: 16px;
    line-height: 1.65;
    overflow-wrap: anywhere;
  `,
  /* Text, Caption, List and Markdown set the weight; elsewhere bold stays the browser's bolder. */
  strong: css`
    font-weight: var(--_openui-intelligent-strong-weight, bolder);
  `,
  code: css`
    padding: 1px 5px;
    border-radius: 5px;
    background: ${tokens.surface};
    font-family: ${tokens.mono};
    font-size: 0.88em;
  `,
  block: css`
    margin: var(${GAP}, 0) 0 0;
  `,
  gap: {
    list: css`
      ${GAP}: 6px;
    `,
    afterHeading: css`
      ${GAP}: 8px;
    `,
    normal: css`
      ${GAP}: 12px;
    `,
    beforeHeading: css`
      ${GAP}: 26px;
    `,
  },
  heading: css`
    font-weight: 640;
    color: ${tokens.ink};
  `,
  headingLevel: {
    1: css`
      font-size: 22px;
      letter-spacing: -0.5px;
      line-height: 1.3;
    `,
    2: css`
      font-size: 19px;
      letter-spacing: -0.3px;
      line-height: 1.35;
    `,
    3: css`
      font-size: 16px;
      line-height: 1.4;
    `,
    4: css`
      font-size: 16px;
      line-height: 1.4;
    `,
  },
  list: css`
    padding-left: 1.4em;
    display: flex;
    flex-direction: column;
    gap: 6px;
  `,
  listItem: css`
    padding-left: 2px;
    &::marker {
      color: ${tokens.muted};
    }
  `,
  orderedItem: css`
    &::marker {
      font-variant-numeric: tabular-nums;
      font-weight: 560;
    }
  `,
  quote: css`
    padding: 12px 16px;
    border-left: 3px solid ${tokens.borderStrong};
    border-radius: 0 12px 12px 0;
    background: ${tokens.surface};
    color: ${tokens.ink};
  `,
  codeBlock: css`
    padding: 14px 16px;
    overflow-x: auto;
    border-radius: ${tokens.radiusMd};
    background: ${tokens.surface};
    font: 13px/1.6 ${tokens.mono};
  `,
  rule: css`
    width: 100%;
    height: 0;
    margin: var(${GAP}, 20px) 0 20px;
    border: 0;
    border-top: 1px solid ${tokens.border};
  `,
  /* A framed table: 14px corners, a surface header row, hover rows. */
  tableScroll: css`
    width: 100%;
    min-width: 0;
    overflow-x: auto;
    border: 1px solid ${tokens.border};
    border-radius: 14px;
  `,
  table: css`
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    line-height: 1.5;
  `,
  headCell: css`
    padding: 11px 16px;
    border-bottom: 1px solid ${tokens.border};
    text-align: left;
    vertical-align: middle;
    background: ${tokens.surface};
    color: ${tokens.ink};
    font-size: 13px;
    font-weight: 560;
    white-space: nowrap;
    @media (max-width: 640px) {
      padding: 11px 12px;
    }
  `,
  row: css`
    transition: background 0.15s;
    &:hover {
      background: color-mix(in srgb, ${tokens.surface} 70%, transparent);
    }
    &:last-child {
      ${CELL_BORDER}: 0;
    }
  `,
  cell: css`
    padding: 13px 16px;
    border-bottom: var(${CELL_BORDER}, 1px) solid ${tokens.border};
    text-align: left;
    vertical-align: middle;
    @media (max-width: 640px) {
      padding: 11px 12px;
    }
  `,
};
