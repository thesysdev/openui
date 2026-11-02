import { css } from "../../styles/css";

export const names = {
  root: "openui-citation-item",
  logo: "openui-citation-item-logo",
  content: "openui-citation-item-content",
  title: "openui-citation-item-title",
  source: "openui-citation-item-source",
} as const;

export const citationItemStyles = {
  root: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s, 8px);
    border: none;
    padding: var(--openui-space-xs, 6px) var(--openui-space-s, 8px) var(--openui-space-xs, 6px)
      var(--openui-space-xs, 6px);
    border-radius: var(--openui-radius-m, 8px);
    background-color: transparent;
    transition: background-color 0.2s ease-in-out;
    text-align: left;
    width: 100%;
    max-width: 348px;
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    @media (max-width: 800px) {
      max-width: 320px;
    }
    &:hover {
      background-color: var(--_openui-citation-item-hover-background, transparent);
    }
  `,
  linked: css`
    cursor: pointer;
    --_openui-citation-item-hover-background: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
  `,
  logo: css`
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-s, 6px);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    overflow: hidden;
  `,
  content: css`
    display: flex;
    flex-grow: 1;
    align-items: baseline;
    gap: var(--openui-space-s, 8px);
    min-width: 0;
  `,
  title: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
  source: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,
};
