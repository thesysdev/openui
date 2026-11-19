import { css } from "../../styles/css";

export const names = {
  root: "openui-snippet-card-block",
  card: "openui-snippet-card-block-card",
  lhs: "openui-snippet-card-block-lhs",
  rhs: "openui-snippet-card-block-rhs",
  rhsContent: "openui-snippet-card-block-rhs-content",
  chevron: "openui-snippet-card-block-chevron",
  chevronIcon: "openui-snippet-card-block-chevron-icon",
  clickable: {
    true: "openui-snippet-card-block-card--clickable",
  },
} as const;

export const snippetCardBlockStyles = {
  card: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-m, 12px);
    width: 100%;
    min-width: 0;
    padding: var(--openui-space-s-m, 10px);
    box-sizing: border-box;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-2xl, 14px);
    background-color: var(--openui-sunk-light, oklch(0.097 0 0 / 0.02));
    position: relative;
    overflow: hidden;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
    box-shadow: none;
  `,
  clickable: {
    true: css`
      background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      box-shadow: var(
        --openui-shadow-s,
        0 1px 3px -2px oklch(0 0 0 / 0.02),
        0 2px 5px -2px oklch(0 0 0 / 0.04)
      );
      cursor: pointer;
      &:hover {
        box-shadow: none;
        transform: scale(0.995);
      }
      &:focus-visible {
        outline: 2px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
        outline-offset: 2px;
      }
    `,
  },
  lhs: css`
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
    :where(&) {
      > * {
        min-width: 0;
      }
    }
  `,
  rhs: css`
    flex-shrink: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    margin-left: var(--openui-space-m, 12px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font: var(--openui-text-numbers-lg-heavy, 560 18px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-numbers-lg-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  rhsContent: css`
    display: flex;
    justify-content: flex-end;
    min-width: 0;
    max-width: 100%;
    width: 100%;
    overflow: hidden;
    :where(&) {
      > * {
        min-width: 0;
      }
    }
  `,
  chevron: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `,
  chevronIcon: css`
    width: 14px;
    height: 14px;
  `,
};
