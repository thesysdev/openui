import { css } from "../../styles/css";

export const names = {
  leftContent: "openui-slider-left-content",
  container: "openui-slider-container",
  root: "openui-slider",
  track: "openui-slider-track",
  range: "openui-slider-range",
  thumb: "openui-slider-thumb",
  handle: "openui-slider-thumb-handle",
  handleInner: "openui-slider-thumb-handle-inner",
  handleDot: "openui-slider-thumb-handle-inner-dot",
  value: "openui-slider-thumb-value",
  mark: "openui-slider-dots-dot",
  containerWrapper: "openui-slider-container-wrapper",
  labels: "openui-slider-labels",
  wrapper: "openui-slider-wrapper",
  rightContent: "openui-slider-right-content",
  label: "openui-slider-label",
  variant: {
    continuous: "openui-slider--variant-continuous",
    discrete: "openui-slider--variant-discrete",
  },
} as const;

const smallText = `
  font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const sliderStyles = {
  wrapper: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s, 8px);
    width: 100%;
  `,
  leftContent: css`
    display: flex;
    align-items: center;
    min-width: fit-content;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    ${smallText}
    :where(&) {
      svg {
        width: 16px;
        height: 16px;
      }
    }
  `,
  container: css`
    padding: 0 10px;
    background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    height: 10px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--openui-radius-s, 6px);
  `,
  root: css`
    position: relative;
    display: flex;
    height: 20px;
    width: 100%;
    min-width: 100px;
    max-width: 100%;
    touch-action: none;
    user-select: none;
    align-items: center;
    &[data-disabled] {
      opacity: 0.5;
      pointer-events: none;
    }
  `,
  track: css`
    position: relative;
    height: 10px;
    flex-grow: 1;
    border-radius: var(--openui-radius-full, 9999px);
  `,
  range: css`
    position: absolute;
    height: 100%;
    border-radius: var(--openui-radius-s, 6px);
    background-color: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
    margin-left: -10px;
    margin-right: -8px;
    &[data-at-min] {
      background-color: transparent;
    }
  `,
  // The thumb owns its states, one class plus one state each: they declare its outline and drive
  // the value's opacity. The handle's inner part keeps its own hover fill, as in react-ui, so hovering
  // the tooltip does not tint it.
  thumb: css`
    outline: none;
    --_openui-slider-thumb-value-opacity: 0;
    &:hover {
      outline: none;
      --_openui-slider-thumb-value-opacity: 1;
    }
    &:focus-visible {
      outline: none;
    }
    &[data-disabled] {
      outline: none;
    }
  `,
  handle: css`
    display: block;
    width: 20px;
    height: 20px;
    border-radius: var(--openui-radius-s, 6px);
    outline: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    overflow: hidden;
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
  `,
  handleInner: css`
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    transition: background-color 0.2s;
    &:hover {
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    }
  `,
  handleDot: css`
    width: 6px;
    height: 6px;
    border-radius: var(--openui-radius-3xs, 1px);
    background-color: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
  `,
  value: css`
    ${smallText}
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    padding: var(--openui-space-2xs, 4px);
    border-radius: var(--openui-radius-s, 6px);
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    opacity: var(--_openui-slider-thumb-value-opacity, 0);
    transition: opacity 0.2s;
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
  `,
  mark: css`
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 4px;
    height: 4px;
    border-radius: var(--openui-radius-full, 9999px);
    background-color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    &[data-state="active"] {
      background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    }
  `,
  containerWrapper: css`
    width: 100%;
  `,
  labels: css`
    display: flex;
    justify-content: space-between;
    margin-top: var(--openui-space-s, 8px);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    ${smallText}
    padding: 0 var(--openui-space-2xs, 4px);
  `,
};
