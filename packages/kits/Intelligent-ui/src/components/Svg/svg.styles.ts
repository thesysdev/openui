import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-svg" } as const;

export const styles = {
  root: css`
    display: block;
    max-width: 100%;
    height: auto;
    margin-inline: auto;
    overflow: visible;
    color: ${tokens.ink};
  `,
};
