import { css } from "../../styles/css";

export const names = {
  root: "openui-option-cards",
  grid: "openui-option-cards-grid",
  row: "openui-option-cards-row",
  item: "openui-option-cards-item",
  card: "openui-option-cards-card",
  content: "openui-option-cards-content",
  top: "openui-option-cards-top",
  text: "openui-option-cards-text",
  title: "openui-option-cards-title",
  subtitle: "openui-option-cards-subtitle",
  topContentVariant: {
    icon: "openui-option-cards-top--top-content-variant-icon",
    image: "openui-option-cards-top--top-content-variant-image",
  },
} as const;

export const optionCardsStyles = {
  root: css`
    width: 100%;
    container-type: inline-size;
  `,
  grid: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
    width: 100%;
    @container (max-width:768px) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
    @container (max-width:480px) {
      grid-template-columns: 1fr;
    }
  `,
  row: css`
    display: grid;
    gap: var(--openui-space-m, 12px);
    width: 100%;
    align-items: stretch;
    &[data-columns="1"] {
      grid-template-columns: 1fr;
    }
    &[data-columns="2"] {
      grid-template-columns: repeat(2, 1fr);
    }
    &[data-columns="3"] {
      grid-template-columns: repeat(3, 1fr);
    }
    @container (max-width:768px) {
      display: contents;
    }
  `,
  item: css`
    width: 100%;
    min-width: 0;
    @container (max-width:768px) {
      &[data-span="full"] {
        grid-column: 1 / -1;
      }
    }
  `,
  card: css`
    --_openui-option-cards-checked-border: initial;
    --_openui-option-cards-text-color: initial;
    --_openui-option-cards-background: initial;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: var(--openui-space-s-m, 10px);
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    border-radius: var(--openui-radius-2xl, 14px);
    background-color: var(--_openui-option-cards-background, transparent);
    cursor: pointer;
    text-align: left;
    transition:
      opacity 0.16s ease-out,
      border-color 0.16s ease-out,
      background-color 0.16s ease-out;

    &:hover {
      border-color: var(
        --_openui-option-cards-checked-border,
        var(--openui-border-interactive-emphasis, oklch(0.097 0 0 / 0.3))
      );
    }
    &:focus-visible {
      outline: 2px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
      outline-offset: 2px;
    }
    &[aria-checked="true"] {
      --_openui-option-cards-background: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      border-color: var(--openui-border-interactive-selected, oklch(0.097 0 0 / 1));
      --_openui-option-cards-checked-border: var(
        --openui-border-interactive-selected,
        oklch(0.097 0 0 / 1)
      );
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: var(
        --_openui-option-cards-checked-border,
        var(--openui-border-interactive, oklch(0.097 0 0 / 0.12))
      );
      --_openui-option-cards-text-color: var(
        --openui-text-neutral-tertiary,
        oklch(0.097 0 0 / 0.2)
      );
    }
  `,
  topContentVariant: {
    icon: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: var(--openui-radius-s, 6px);
      background: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    `,
    image: css`
      width: 4.5rem;
      height: 4.5rem;
      border-radius: var(--openui-radius-m, 8px);
      overflow: hidden;
      :where(&) {
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    `,
  },
  content: css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: var(--openui-space-m, 12px);
    width: 100%;
  `,
  top: css`
    align-self: flex-start;
    flex-shrink: 0;
  `,
  text: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-3xs, 2px);
    min-width: 0;
  `,
  title: css`
    color: var(
      --_openui-option-cards-text-color,
      var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1))
    );
    word-wrap: break-word;
    overflow-wrap: break-word;
    font: var(--openui-text-body-default-heavy, 560 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  subtitle: css`
    color: var(
      --_openui-option-cards-text-color,
      var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6))
    );
    word-wrap: break-word;
    overflow-wrap: break-word;
    font: var(--openui-text-body-sm, 400 14px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
  `,
};
