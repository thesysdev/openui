import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-quote",
  text: "openui-intelligent-quote-text",
  cite: "openui-intelligent-quote-cite",
} as const;

export const styles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin: 0;
    padding: 14px 16px;
    border-left: 3px solid ${tokens.ink};
    border-radius: 0 12px 12px 0;
    background: ${tokens.surface};
  `,
  text: css`
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
  `,
  cite: css`
    color: ${tokens.muted};
    font-size: 13px;
    font-style: normal;
  `,
};
