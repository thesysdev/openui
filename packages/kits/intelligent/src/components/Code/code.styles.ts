import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-code",
  head: "openui-intelligent-code-head",
  copy: "openui-intelligent-code-copy",
  pre: "openui-intelligent-code-pre",
} as const;

export const styles = {
  root: css`
    min-width: 0;
    overflow: hidden;
    border: 1px solid ${tokens.border};
    border-radius: ${tokens.radiusLg};
    background: ${tokens.surface};
  `,
  head: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px 6px 14px;
    border-bottom: 1px solid ${tokens.border};
    color: ${tokens.muted};
    font-size: 12px;
  `,
  copy: css`
    &&.openui-button {
      gap: 5px;
      height: auto;
      min-height: 0;
      padding: 4px 8px;
      border-radius: 6px;
      background: none;
      color: inherit;
      font: inherit;
      &:hover {
        background: ${tokens.hover};
        color: ${tokens.ink};
      }
    }
  `,
  pre: css`
    margin: 0;
    padding: 14px 16px;
    overflow-x: auto;
    font: 13px/1.6 ${tokens.mono};
  `,
};
