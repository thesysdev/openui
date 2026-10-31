import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = { root: "openui-intelligent-you-tube", frame: "openui-intelligent-you-tube-frame" } as const;

export const styles = {
  root: css`
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: ${tokens.radiusLg};
    background: #000;
  `,
  frame: css`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  `,
};
