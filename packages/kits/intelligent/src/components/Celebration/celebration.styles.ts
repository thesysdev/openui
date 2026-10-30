import { css, keyframes } from "goober";

export const DRIFT = "--_openui-intelligent-celebration-drift";
export const SPIN = "--_openui-intelligent-celebration-spin";

const fall = keyframes`
  to {
    transform: translate(var(${DRIFT}, 0), 105vh) rotate(var(${SPIN}, 0deg));
    opacity: 0.7;
  }
`;

export const names = { root: "openui-intelligent-celebration", piece: "openui-intelligent-celebration-piece" } as const;

export const styles = {
  root: css`
    position: fixed;
    inset: 0;
    z-index: 3000;
    overflow: hidden;
    pointer-events: none;
    @media (prefers-reduced-motion: reduce) {
      display: none;
    }
  `,
  piece: css`
    position: absolute;
    top: -12px;
    width: 8px;
    height: 12px;
    border-radius: 2px;
    animation: ${fall} 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) forwards;
  `,
};
