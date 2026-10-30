import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-caption" } as const;

export const styles = {
  root: css`
    --_openui-intelligent-strong-weight: 640;
    margin: 0;
    color: ${tokens.muted};
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  `,
};
