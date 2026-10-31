import { css } from "../../styles/css";

export const names = {
  card: "openui-composite-card",
  root: "openui-composite-card-block",
  wrapper: "openui-composite-card-wrapper",
  header: "openui-composite-card-header",
  body: "openui-composite-card-body",
  footer: "openui-composite-card-footer",
  footerContent: "openui-composite-card-footer-content",
  clickable: {
    true: "openui-composite-card--clickable",
  },
} as const;

export const compositeCardStyles = {
  card: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
    min-width: 15rem;
    height: 100%;
    padding: var(--openui-space-m, 12px);
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-3xl, 16px);
    box-sizing: border-box;
    background: var(--openui-sunk-light, oklch(0.097 0 0 / 0.02));
  `,
  wrapper: css`
    height: 100%;
  `,
  clickable: {
    true: css`
      background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      box-shadow: var(
        --openui-shadow-m,
        0 4px 6px -2px oklch(0 0 0 / 0.025),
        0 2px 2px -2px oklch(0 0 0 / 0.05)
      );
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
      &:hover {
        transform: scale(0.995);
        box-shadow: none;
      }
      &:focus-visible {
        outline: 2px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
        outline-offset: 2px;
      }
    `,
  },
  header: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
    flex-shrink: 0;
  `,
  body: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
    min-height: 0;
  `,
  footer: css`
    display: flex;
    flex-shrink: 0;
    margin-top: auto;
  `,
  footerContent: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-s, 8px);
    width: 100%;
  `,
};
