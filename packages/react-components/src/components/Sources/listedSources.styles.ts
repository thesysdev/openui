import { css } from "../../styles/css";

export const names = {
  root: "openui-sources",
  header: "openui-sources-header",
  title: "openui-sources-title",
  buttons: "openui-sources-buttons",
  container: "openui-sources-item-container",
} as const;

export const listedSourcesStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
  `,
  header: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
  `,
  title: css`
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    font: var(--openui-text-label-default-heavy, 560 16px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-default-heavy-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-medium, "wght" 560);
  `,
  buttons: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--openui-space-s, 8px);
  `,
  // This is the Sources-owned card, not a CarouselItem, so only Sources' own rules style it.
  container: css`
    box-sizing: border-box;
    scroll-snap-align: start;
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-m, 12px);
    flex-shrink: 0;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    width: 180px !important;
    padding: var(--openui-space-000, 0);
    border-radius: var(--openui-radius-l, 10px);
    overflow: hidden;
    background-color: transparent !important;
    &:hover {
      background-color: var(--_openui-sources-item-hover-background, transparent) !important;
      border-color: var(
        --_openui-sources-item-hover-border,
        var(--openui-border-default, oklch(0.097 0 0 / 0.06))
      );
    }
  `,
  linked: css`
    --_openui-sources-item-hover-background: var(
      --openui-highlight-subtle,
      oklch(0.097 0 0 / 0.02)
    );
    --_openui-sources-item-hover-border: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
  `,
};
