import { css } from "../../styles/css";
import { calendarStyles } from "../Calendar/calendar.styles";

// Retain a value dependency on Calendar's defaults before registering the owned content rules.
Object.values(calendarStyles);

export const names = {
  root: "openui-date-picker",
  trigger: "openui-date-picker-trigger",
  text: "openui-date-picker-text",
  icon: "openui-date-picker-icon",
  reference: "openui-date-picker-reference",
  content: "openui-date-picker-content",
  menu: "openui-date-picker-menu",
  calendar: "openui-date-picker-calendar",
  calendarContent: "openui-date-picker-calendar-content",
  mode: { single: "openui-date-picker--mode-single", range: "openui-date-picker--mode-range" },
} as const;

export const datePickerStyles = {
  root: css`
    position: relative;
  `,
  trigger: css`
    --_openui-date-picker-icon-transform: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid var(--openui-border-default, oklch(0.097 0 0 / 0.06));
    border-radius: var(--openui-radius-m, 8px);
    background: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    padding: var(--openui-space-s, 8px) var(--openui-space-m, 12px);
    font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
    letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    cursor: pointer;
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    width: 100%;

    &:hover {
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    }
    &[data-state="open"] {
      --_openui-date-picker-icon-transform: rotate(180deg);
      border-color: var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
    }
    &[data-placeholder="true"] {
      color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    }

    &:disabled {
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
      cursor: not-allowed;
    }
  `,
  text: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  icon: css`
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform: var(--_openui-date-picker-icon-transform, none);
  `,
  reference: css`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  `,
  content: css`
    z-index: 50;
    width: fit-content;
  `,
  menu: css`
    background: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    border-radius: var(--openui-radius-2xl, 14px);
    box-shadow: var(
      --openui-shadow-s,
      0 1px 3px -2px oklch(0 0 0 / 0.02),
      0 2px 5px -2px oklch(0 0 0 / 0.04)
    );
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    overflow: hidden;
    transform-origin: top center;
    animation: _openui-date-picker-show 0.18s ease-out forwards;
    @keyframes _openui-date-picker-show {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `,
  calendar: css`
    width: 100%;
    height: 100%;
  `,
};

export const datePickerCalendarStyles = {
  content: css`
    border: none;
    border-radius: 0;
  `,
};
