import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-html-view",
  frame: "openui-intelligent-html-view-frame",
  wait: "openui-intelligent-html-view-wait",
} as const;

export const styles = {
  root: css`
    position: relative;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    border: 1px solid ${tokens.border};
    border-radius: ${tokens.radiusLg};
    background: ${tokens.canvas};
  `,
  frame: css`
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background: transparent;
  `,
  wait: css`
    display: grid;
    place-items: center;
    height: 100%;
    color: ${tokens.muted};
    font-size: 13px;
  `,
};
