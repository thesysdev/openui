import { css } from "../../styles/css";

export const names = {
  root: "openui-image",
  aspect: "openui-image-aspect",
  viewport: "openui-image-viewport",
  scale: { fit: "openui-image--scale-fit", fill: "openui-image--scale-fill" },
  aspectRatio: {
    "1:1": "openui-image-aspect--aspect-ratio-1-1",
    "3:2": "openui-image-aspect--aspect-ratio-3-2",
    "3:4": "openui-image-aspect--aspect-ratio-3-4",
    "4:3": "openui-image-aspect--aspect-ratio-4-3",
    "16:9": "openui-image-aspect--aspect-ratio-16-9",
  },
} as const;
export const imageStyles = {
  root: css`
    display: flex;
    box-sizing: border-box;
    max-width: 100%;
    width: 100%;
    height: 100%;
    overflow: clip;
    border-radius: var(--openui-radius-m, 8px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    &[data-error] {
      visibility: hidden;
    }
  `,
  aspect: css`
    position: relative;
    width: 100%;
    padding-bottom: var(--_openui-image-aspect-padding);
  `,
  viewport: css`
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  `,
  scale: {
    fit: css`
      object-fit: contain;
    `,
    fill: css`
      object-fit: cover;
    `,
  },
  aspectRatio: {
    "1:1": css`
      --_openui-image-aspect-padding: 100%;
    `,
    "3:2": css`
      --_openui-image-aspect-padding: 66.66666666666667%;
    `,
    "3:4": css`
      --_openui-image-aspect-padding: 133.33333333333334%;
    `,
    "4:3": css`
      --_openui-image-aspect-padding: 75%;
    `,
    "16:9": css`
      --_openui-image-aspect-padding: 56.25%;
    `,
  },
};
