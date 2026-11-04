import { css } from "../../styles/css";

export const names = {
  root: "openui-overview-card-block",
  card: "openui-overview-card-block-card",
  vertical: "openui-overview-card-block-vertical",
  topRow: "openui-overview-card-block-top-row",
  top: "openui-overview-card-block-top",
  bottom: "openui-overview-card-block-bottom",
  chevron: "openui-overview-card-block-chevron",
  chevronIcon: "openui-overview-card-block-chevron-icon",
  clickable: {
    true: "openui-overview-card-block-card--clickable",
  },
} as const;

export const overviewCardBlockStyles = {
  card: css`
    /* react-ui's content-box sizing, declared so a page's box-sizing reset (Tailwind's preflight, for
       one) cannot change the geometry. */
    box-sizing: content-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 158px;
    padding: var(--openui-space-s-m, 10px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-2xl, 14px);
    background-color: var(--openui-sunk-light, oklch(0.097 0 0 / 0.02));
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;
  `,
  clickable: {
    true: css`
      background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      box-shadow: var(
        --openui-shadow-m,
        0 4px 6px -2px oklch(0 0 0 / 0.025),
        0 2px 2px -2px oklch(0 0 0 / 0.05)
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
  vertical: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--openui-space-l, 18px);
    min-width: 0;
    min-height: 0;
  `,
  topRow: css`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
    width: 100%;
    min-width: 0;
  `,
  top: css`
    width: 100%;
    min-width: 0;

    flex: 1;
    min-width: 0;
    width: auto;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
    min-height: var(--openui-space-xl, 24px);
  `,
  bottom: css`
    width: 100%;
    min-width: 0;

    display: flex;
    flex-direction: column;
    gap: var(--openui-space-2xs, 4px);
  `,
  chevron: css`
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  chevronIcon: css`
    width: 14px;
    height: 14px;
  `,
};
