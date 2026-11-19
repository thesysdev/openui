import { css } from "../../styles/css";

export const names = {
  root: "openui-dot-matrix-loader",
  dot: "openui-dot-matrix-loader-dot",
  variant: {
    default: "openui-dot-matrix-loader--variant-default",
    compact: "openui-dot-matrix-loader--variant-compact",
  },
} as const;

export const dotMatrixLoaderStyles = {
  root: css`
    display: grid;
    grid-template-columns: repeat(var(--_openui-dot-matrix-loader-grid-size), 1fr);
    width: var(--_openui-dot-matrix-loader-size);
    height: var(--_openui-dot-matrix-loader-size);
  `,
  dot: css`
    justify-self: center;
    align-self: center;
    width: 68%;
    aspect-ratio: 1;
    border-radius: 50%;
    background-color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    opacity: var(--_openui-dot-matrix-loader-dot-opacity, 0.14);
  `,
};
