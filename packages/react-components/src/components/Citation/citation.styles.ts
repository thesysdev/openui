import { css } from "../../styles/css";

export const names = {
  container: "openui-citation-container",
  root: "openui-citation",
  icon: "openui-citation-icon",
  tooltip: "openui-citation-tooltip",
  tooltipContent: "openui-citation-tooltip-content",
} as const;

export const citationStyles = {
  container: css`
    position: relative;
    display: inline-flex;
  `,
  root: css`
    height: 20px;
    width: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--openui-space-3xs, 2px);
    background-color: var(--openui-highlight-strong, oklch(0.097 0 0 / 0.08));
    margin-left: var(--openui-space-3xs, 2px);
    border: none;
    border-radius: var(--openui-radius-xs, 4px);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    --_openui-citation-icon-color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    &:hover,
    &[data-state="delayed-open"],
    &[data-state="instant-open"] {
      --_openui-citation-icon-color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
    &:active {
      background-color: var(--openui-highlight-strong, oklch(0.097 0 0 / 0.08));
    }
    &:focus-visible {
      outline: 2px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      outline-offset: 2px;
    }
  `,
  tooltip: css`
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-xl, 12px);
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    white-space: nowrap;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    z-index: 1000;
    pointer-events: all;
    overflow: hidden;

    &[data-side="top"] {
      --_openui-citation-tooltip-animation: --_openui-citation-down;
    }
    &[data-side="bottom"] {
      --_openui-citation-tooltip-animation: --_openui-citation-up;
    }
    &[data-side="right"] {
      --_openui-citation-tooltip-animation: --_openui-citation-left;
    }
    &[data-side="left"] {
      --_openui-citation-tooltip-animation: --_openui-citation-right;
    }
    &[data-state="delayed-open"] {
      animation: var(--_openui-citation-tooltip-animation) 0.2s ease-in-out;
    }
    @keyframes --_openui-citation-down {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes --_openui-citation-up {
      from {
        opacity: 0;
        transform: translateY(2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes --_openui-citation-left {
      from {
        opacity: 0;
        transform: translateX(2px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes --_openui-citation-right {
      from {
        opacity: 0;
        transform: translateX(-2px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  tooltipContent: css`
    padding: var(--openui-space-xs, 6px);
    display: flex;
    flex-direction: column;
    gap: var(--openui-space-2xs, 4px);
    overflow-y: auto;
    max-height: min(50vh);
    scrollbar-width: thin;
    scrollbar-color: var(--openui-border-default, oklch(0.097 0 0 / 0.06)) transparent;
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--openui-border-default, oklch(0.097 0 0 / 0.06));
      border-radius: var(--openui-radius-full, 9999px);
    }
  `,
  icon: css`
    color: var(--_openui-citation-icon-color);
  `,
};
