import { css } from "../../styles/css";

export const names = {
  root: "openui-image-text-large",
  imageWrap: "openui-image-text-large-image-wrap",
  image: "openui-image-text-large-image",
  content: "openui-image-text-large-content",
} as const;
export const imageTextLargeStyles = {
  root: css`
    display: flex;
    width: 100%;
    min-width: 0;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
  `,
  imageWrap: css`
    position: relative;
    width: 100%;
    min-height: 60px;
    max-height: 180px;
    border-radius: var(--openui-radius-m, 8px);
    overflow: hidden;
    background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    line-height: 0;
  `,
  image: css`
    display: block;
    width: 100%;
    height: 180px;
    max-height: 180px;
    object-fit: cover;
  `,
};
