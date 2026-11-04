import { css } from "../../styles/css";

export const names = {
  root: "openui-carousel",
  content: "openui-carousel-content",
  contentWrapper: "openui-carousel-content-wrapper",
  item: "openui-carousel-item",
  button: "openui-carousel-button",
  left: "openui-carousel-button-left",
  right: "openui-carousel-button-right",
  previous: "openui-carousel-previous",
  next: "openui-carousel-next",
  variant: { card: "openui-carousel--variant-card", sunk: "openui-carousel--variant-sunk" },
  noSnap: { true: "openui-carousel--no-snap" },
  showButtons: { true: "openui-carousel--show-buttons" },
} as const;
export const carouselStyles = {
  root: css`
    position: relative;
    display: flex;
  `,
  variant: {
    card: css`
      --_openui-carousel-item-background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    `,
    sunk: css`
      --_openui-carousel-item-background: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    `,
  },
  content: css`
    position: relative;
    display: flex;
    flex-direction: row;
    gap: var(--openui-space-m, 12px);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    ms-overflow-x: hidden;
    scrollbar-width: none;
    &[data-mask="both"] {
      mask-image: linear-gradient(
        to right,
        transparent,
        black 40px,
        black calc(100% - 40px),
        transparent
      );
      -webkit-mask-image: linear-gradient(
        to right,
        transparent,
        black 40px,
        black calc(100% - 40px),
        transparent
      );
    }
    &[data-mask="left"] {
      mask-image: linear-gradient(to right, transparent, black 40px, black);
      -webkit-mask-image: linear-gradient(to right, transparent, black 40px, black);
    }
    &[data-mask="right"] {
      mask-image: linear-gradient(to left, transparent, black 40px, black);
      -webkit-mask-image: linear-gradient(to left, transparent, black 40px, black);
    }
    &::-webkit-scrollbar {
      display: none;
    }
    :where(&) {
      > * {
        box-sizing: border-box;
        scroll-snap-align: start;
      }
    }
  `,
  contentWrapper: css`
    display: flex;
    gap: var(--openui-space-m, 12px);
  `,
  item: css`
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
    width: 280px;
    flex-shrink: 0;
    border-radius: var(--openui-radius-2xl, 14px);
    background-color: var(
      --_openui-carousel-item-background,
      var(--openui-foreground, oklch(0.994 0 89.876 / 1))
    );
    padding: var(--openui-space-m, 12px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    @media (max-width: 400px) {
      width: 248px;
      flex-shrink: 0;
    }
  `,
  button: css`
    position: absolute;
    top: 50%;
    z-index: 10;
    transform: translateY(-50%);
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    border-radius: var(--openui-radius-s, 6px);
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  left: css`
    left: -12px;
  `,
  right: css`
    right: -12px;
  `,
};
