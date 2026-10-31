import { css } from "../../styles/css";

export const names = {
  card: "openui-visual-card",
  root: "openui-visual-card-block",
  top: "openui-visual-card-top",
  tag: "openui-visual-card-tag",
  action: "openui-visual-card-action",
  bottom: "openui-visual-card-bottom",
  actionIcon: "openui-visual-card-action-icon",
  clickable: {
    true: "openui-visual-card--clickable",
  },
} as const;

export const visualCardStyles = {
  card: css`
    /* react-ui's content-box sizing, declared so a page's box-sizing reset (Tailwind's preflight, for
       one) cannot change the geometry. */
    box-sizing: content-box;
    --_openui-visual-card-image: initial;
    --_openui-visual-card-image-transform: initial;
    position: relative;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    min-height: 280px;
    height: 100%;
    border-radius: var(--openui-radius-3xl, 16px);
    overflow: hidden;
    background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    transition:
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      background-image: var(--_openui-visual-card-image, none);
      background-size: cover;
      background-position: center;
      transition: transform 0.25s ease;
      transform: var(--_openui-visual-card-image-transform, none);
    }
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.56) 100%);
    }
  `,
  clickable: {
    true: css`
      cursor: pointer;
      box-shadow: var(
        --openui-shadow-s,
        0 1px 3px -2px oklch(0 0 0 / 0.02),
        0 2px 5px -2px oklch(0 0 0 / 0.04)
      );
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      &:hover {
        box-shadow: none;
        transform: scale(0.995);
        --_openui-visual-card-image-transform: scale(1.04);
      }
      &:focus-visible {
        outline: 2px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
        outline-offset: 2px;
      }
    `,
  },
  top: css`
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    min-height: 24px;
    padding: var(--openui-space-m, 12px);
  `,
  tag: css`
    min-width: 0;
  `,
  action: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.4);
    color: var(--openui-text-white, oklch(1 0 89.876 / 1));
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    border-radius: var(--openui-radius-s, 6px);
    padding: var(--openui-space-2xs, 4px);
  `,
  bottom: css`
    position: relative;
    z-index: 2;
    box-sizing: border-box;
    margin: auto var(--openui-space-m, 12px) var(--openui-space-m, 12px) var(--openui-space-m, 12px);
    padding: var(--openui-space-s, 8px) var(--openui-space-s-m, 10px);
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-l, 10px);
  `,
  actionIcon: css`
    width: 16px;
    height: 16px;
  `,
};
