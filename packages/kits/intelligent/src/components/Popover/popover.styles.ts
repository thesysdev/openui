import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { trigger: "openui-intelligent-popover-trigger", panel: "openui-intelligent-popover" } as const;

export const styles = {
  trigger: css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    &:hover {
      color: ${tokens.muted};
    }
  `,
  panel: css`
    position: fixed;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: max-content;
    max-width: min(280px, calc(100vw - 24px));
    padding: 12px 14px;
    border: 1px solid ${tokens.border};
    border-radius: ${tokens.radiusLg};
    background: ${tokens.canvas};
    color: ${tokens.ink};
    box-shadow: ${tokens.shadow};
    font: 440 14px/1.5 ${tokens.font};
  `,
};
