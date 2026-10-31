import { css } from "../../styles/css";

export const names = {
  root: "openui-image-block",
  image: "openui-image-block-image",
  loader: "openui-image-block-loader",
} as const;
export const imageBlockStyles = {
  root: css`
    /* react-ui's content-box sizing, declared so a page's box-sizing reset (Tailwind's preflight, for
       one) cannot change the geometry. */
    box-sizing: content-box;
    flex: 1 1 0;
    min-width: 0;
    min-height: 240px;
    max-height: 240px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    isolation: isolate;
    border-radius: var(--openui-radius-2xl, 14px);
    padding: calc(var(--openui-space-l, 18px) - 2px) calc(var(--openui-space-l, 18px) + 2px);
    overflow: hidden;
    &::before {
      content: "";
      position: absolute;
      inset: -20px;
      background-image: var(--_openui-image-block-background);
      background-size: 150%;
      background-position: center;
      background-repeat: no-repeat;
      opacity: 0.2;
      filter: blur(12px);
      z-index: 0;
      border-radius: inherit;
    }

    &[data-breakpoint="mobile"] {
      height: auto;
      width: 100%;
      padding: 0;
    }
    &[data-error] {
      visibility: hidden;
    }
  `,
  image: css`
    box-sizing: content-box;
    height: 100%;
    max-width: 100%;
    object-fit: cover;
    border: 4px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-l, 10px);
    position: relative;
    z-index: 1;

    &[data-breakpoint="mobile"] {
      border-radius: var(--openui-radius-2xl, 14px);
      width: 100%;
      height: auto;
    }
    &[data-error] {
      visibility: hidden;
    }
  `,
  loader: css`
    @keyframes _openui-image-block-spin {
      to {
        transform: rotate(360deg);
      }
    }
    position: absolute;
    left: 50%;
    box-sizing: content-box;
    top: 50%;
    translate: -50% -50%;
    border-width: 3px;
    border-style: solid;
    height: 24px;
    width: 24px;
    animation: _openui-image-block-spin 1s linear infinite;
    border-radius: var(--openui-radius-full, 9999px);
    border-color: rgb(209, 213, 219);
    border-top-color: rgb(37, 99, 235);
    z-index: 2;
  `,
};
