import { css } from "../../styles/css";
import { selectStyles } from "../Select/select.styles";

// Retain a value dependency on Select's defaults before registering the owned dropdown rules.
Object.values(selectStyles);

export const names = {
  root: "openui-calendar",
  content: "openui-calendar-content",
  nav: "openui-calendar-nav",
  dropdowns: "openui-calendar-dropdowns",
  month: "openui-calendar-month",
  weekdays: "openui-calendar-weekdays",
  monthCaption: "openui-calendar-month-caption",
  monthsDropdown: "openui-calendar-months-dropdown",
  yearsDropdown: "openui-calendar-years-dropdown",
  chevron: "openui-calendar-chevron",
  monthGrid: "openui-calendar-month-grid",
  weekday: "openui-calendar-weekday",
  day: "openui-calendar-day",
  dayButton: "openui-calendar-day-button",
  buttonNext: "openui-calendar-button-next",
  buttonPrevious: "openui-calendar-button-previous",
  footer: "openui-calendar-footer",
  selectTrigger: "openui-calendar-select-trigger",
  selectContentMonths: "openui-calendar-select-content-months",
  selectContentYears: "openui-calendar-select-content-years",
  selectItem: "openui-calendar-select-item",
  selectViewport: "openui-calendar-select-viewport",
  months: "openui-calendar-months",
  weeks: "openui-calendar-weeks",
  week: "openui-calendar-week",
  captionLabel: "openui-calendar-caption-label",
  weekNumber: "openui-calendar-week-number",
  weekNumberHeader: "openui-calendar-week-number-header",
  layout: {
    mobile: "openui-calendar--layout-mobile",
    fullscreen: "openui-calendar--layout-fullscreen",
    tray: "openui-calendar--layout-tray",
    copilot: "openui-calendar--layout-copilot",
  },
} as const;
const body = `
  font: var(--openui-text-body-default, 400 16px/1.5 "Inter", sans-serif);
  letter-spacing: var(--openui-text-body-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;
const label = `
  font: var(--openui-text-label-default, 400 16px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-label-default-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;
const small = `
  font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
  letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
  font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
`;

export const calendarStyles = {
  content: css`
    --_openui-calendar-day-size: calc(var(--openui-space-2xl, 36px) + var(--openui-space-2xs, 4px));
    --_openui-calendar-cell-radius: var(--openui-radius-m, 8px);
    ${body}
    width: fit-content;
    max-width: 100%;
    box-sizing: border-box;
    padding: var(--openui-space-l, 18px);
    border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
    border-radius: var(--openui-radius-3xl, 16px);
    background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  nav: css`
    gap: var(--_openui-calendar-nav-gap);
  `,
  dropdowns: css`
    gap: var(--_openui-calendar-dropdowns-gap);
  `,
  month: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  weekdays: css`
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  monthCaption: css`
    ${body}
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--openui-space-s, 8px);
    height: auto;
    margin-bottom: var(--openui-space-s, 8px);
    font-weight: inherit;
    font-size: inherit;
  `,
  monthsDropdown: css`
    cursor: pointer;
  `,
  yearsDropdown: css`
    cursor: pointer;
  `,
  chevron: css`
    fill: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
  `,
  monthGrid: css`
    width: auto;
    table-layout: auto;
    border-collapse: collapse;
  `,
  // Preserve the native table-cell inset used in react-ui, including under Preflight.
  weekNumber: css`
    padding: 1px;
  `,
  weekNumberHeader: css`
    padding: 1px;
  `,
  weekday: css`
    ${small}
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
    width: var(--_openui-calendar-day-size);
    height: var(--_openui-calendar-day-size);
    padding: 0;
    text-transform: none;
    text-align: center;
    vertical-align: middle;
  `,
  day: css`
    width: var(--_openui-calendar-day-size);
    height: var(--_openui-calendar-day-size);
    min-width: var(--_openui-calendar-day-size);
    min-height: var(--_openui-calendar-day-size);
    padding: 0;
    vertical-align: middle;
    &[data-today-unselected] {
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      border-radius: var(--_openui-calendar-cell-radius);
    }
    &[data-disabled] {
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    }
    &[data-selection] {
      background: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
      color: var(--openui-text-accent-primary, oklch(0.994 0 89.876 / 1));
      border-radius: var(--_openui-calendar-cell-radius);
    }
    &[data-range-start] {
      background: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
      color: var(--openui-text-accent-primary, oklch(0.994 0 89.876 / 1));
      border-top-left-radius: var(--_openui-calendar-cell-radius);
      border-bottom-left-radius: var(--_openui-calendar-cell-radius);
    }
    &[data-range-middle] {
      background: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
    }
    &[data-range-end] {
      background: var(--openui-interactive-accent-default, oklch(0.546 0.215 262.881 / 1));
      color: var(--openui-text-accent-primary, oklch(0.994 0 89.876 / 1));
      border-top-right-radius: var(--_openui-calendar-cell-radius);
      border-bottom-right-radius: var(--_openui-calendar-cell-radius);
    }
  `,
  dayButton: css`
    ${label}
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--_openui-calendar-cell-radius);
    background: transparent;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;
    &:focus-within {
      outline: none;
    }
    &:focus-visible {
      outline: 2px solid var(--openui-border-accent, oklch(0.546 0.215 262.881 / 0.08));
      outline-offset: var(--openui-space-3xs, 2px);
    }
    &:hover {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    }
    &:disabled {
      background-color: transparent;
      cursor: not-allowed;
      color: var(--openui-text-neutral-tertiary, oklch(0.097 0 0 / 0.2));
    }
  `,
  buttonNext: css`
    display: none;
  `,
  buttonPrevious: css`
    display: none;
  `,
  footer: css`
    ${body}
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  layout: {
    mobile: css`
      --_openui-calendar-nav-gap: var(--openui-space-s, 8px);
      --_openui-calendar-dropdowns-gap: var(--openui-space-2xs, 4px);
    `,
    fullscreen: css`
      --_openui-calendar-nav-gap: var(--openui-space-m, 12px);
      --_openui-calendar-dropdowns-gap: var(--openui-space-s, 8px);
    `,
    tray: css`
      --_openui-calendar-nav-gap: var(--openui-space-m, 12px);
      --_openui-calendar-dropdowns-gap: var(--openui-space-s, 8px);
    `,
    copilot: css`
      --_openui-calendar-nav-gap: var(--openui-space-m, 12px);
      --_openui-calendar-dropdowns-gap: var(--openui-space-s, 8px);
    `,
  },
};

const dropdown = `
  padding: var(--openui-space-2xs, 4px);
  background-color: var(--openui-foreground, oklch(0.994 0 89.876 / 1));
  border: 1px solid var(--openui-border-interactive, oklch(0.097 0 0 / 0.12));
  border-radius: var(--openui-radius-xl, 12px);
  box-shadow: var(--openui-shadow-m, 0 4px 6px -2px oklch(0 0 0 / 0.025), 0 2px 2px -2px oklch(0 0 0 / 0.05));
`;

// Register after Select so these owned classes compose on top of its public parts.
export const calendarDropdownStyles = {
  selectTrigger: css`
    ${label}
    min-height: calc(var(--openui-space-l, 18px) + var(--openui-space-s, 8px));
    padding: var(--openui-space-xs, 6px) var(--openui-space-s, 8px);
    border: 1px solid transparent;
    border-radius: var(--openui-radius-s, 6px);
    background-color: transparent;
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    gap: var(--openui-space-2xs, 4px);
    &:hover {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    }
    &:focus-visible {
      outline-offset: var(--openui-space-3xs, 2px);
    }
    &[data-state="open"] {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    }
    /* In react-ui the month/year cursor rule tied and followed Select's disabled rule. */
    &:disabled {
      cursor: pointer;
    }
  `,
  selectContentMonths: css`
    ${dropdown}
  `,
  selectContentYears: css`
    ${dropdown}
  `,
  selectViewport: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--openui-space-2xs, 4px);
  `,
  selectItem: css`
    ${body}
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    justify-self: center;
    border-radius: var(--openui-radius-s, 6px);
    padding: var(--openui-space-xs, 6px) var(--openui-space-s, 8px);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    &:hover {
      background-color: var(--openui-highlight-subtle, oklch(0.097 0 0 / 0.02));
    }
    &[data-highlighted] {
      background-color: var(--openui-highlight, oklch(0.097 0 0 / 0.04));
      color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    }
  `,
};
