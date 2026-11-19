import { css } from "../../styles/css";

export const names = { root: "openui-skeleton-pulse" } as const;

// Register the animation and its keyframes together on import, in the animated part's layer.
// The keyframe name is private.
export const skeletonPulseStyles = {
  root: css`
    animation: _openui-skeleton-pulse 1.2s ease-in-out infinite;
    @keyframes _openui-skeleton-pulse {
      0% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.85;
      }
      100% {
        opacity: 0.3;
      }
    }
  `,
};
