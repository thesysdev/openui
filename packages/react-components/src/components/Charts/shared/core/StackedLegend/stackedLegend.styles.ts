import { css } from "../../../../../styles/css";

import { buttonStyles } from "../../../../Button/button.styles";
import { iconButtonStyles } from "../../../../IconButton/iconButton.styles";

// IconButton registers on import. Reading its map keeps that value import, so its rules come
// before these equal-weight part rules, which register when this module is imported.
Object.values(iconButtonStyles);

export const names = {
  root: "openui-stacked-legend",
  header: "openui-stacked-legend-header",
  headerButtons: "openui-stacked-legend-header-buttons",
  headerTitle: "openui-stacked-legend-header-title",
  scrollButton: "openui-stacked-legend-scroll-button",
  list: "openui-stacked-legend-list",
  item: "openui-stacked-legend-item",
  label: "openui-stacked-legend-item-label",
  colorContainer: "openui-stacked-legend-item-color-container",
  color: "openui-stacked-legend-item-color",
  labelText: "openui-stacked-legend-item-label-text",
  value: "openui-stacked-legend-item-value",
  showMore: "openui-stacked-legend-show-more-button",
  separator: "openui-stacked-legend-separator",
  layout: "openui-chart-with-stacked-legend",
  chart: "openui-chart-with-stacked-legend-chart",
  legend: "openui-chart-with-stacked-legend-panel",
} as const;

// Keep composed controls before these equal-weight part rules.
Object.values(buttonStyles);
export const stackedLegendStyles = {
  root: css`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: var(--_openui-stacked-legend-root-justify-content, normal);
  `,
  header: css`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 var(--openui-space-xs, 6px) var(--openui-space-xs, 6px) var(--openui-space-l, 18px);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  headerButtons: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--openui-space-xs, 6px);
  `,
  headerTitle: css`
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  scrollButton: css`
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  `,
  list: css`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: safe center;
    min-width: 200px;
    overflow-y: scroll;
    height: var(--_openui-stacked-legend-list-height, 100%);
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-behavior: smooth;
    max-height: var(--_openui-stacked-legend-list-max-height, none);
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  item: css`
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 4px 8px;
    border-radius: var(--openui-radius-m, 8px);
    transition: all 0.2s ease-in-out;
    height: 32px;
    flex-shrink: 0;
    opacity: var(--_openui-stacked-legend-item-opacity, 1);
    &[data-clickable] {
      cursor: pointer;
    }
    &[data-state="active"] {
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      --_openui-stacked-legend-color-scale: scale(1.3);
    }
    /* react-ui's hover selector outweighed its active selector, including on active rows. */
    &:hover {
      background-color: var(--openui-sunk, oklch(0.097 0 0 / 0.04));
      --_openui-stacked-legend-color-scale: scale(1.2);
    }
  `,
  label: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
  `,
  colorContainer: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 10px;
    height: 100%;
    width: 32px;
    flex-shrink: 0;
  `,
  color: css`
    width: 10px;
    height: 10px;
    border-radius: 2px;
    transition: all 0.2s ease-in-out;
    background-color: var(--_openui-stacked-legend-item-color);
    transform: var(--_openui-stacked-legend-color-scale, none);
  `,
  labelText: css`
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    transition: color 0.2s ease-in-out;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  `,
  value: css`
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    color: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    transition: all 0.2s ease-in-out;
    flex-shrink: 0;
  `,
  showMore: css`
    width: 100%;
    justify-content: center;
    margin-top: var(--openui-space-2xs, 4px);
  `,
  separator: css`
    margin: var(--openui-space-2xs, 4px) 0;
  `,
  layout: css`
    display: flex;
    position: relative;
    gap: 20px;
    align-items: center;
    &[data-orientation="vertical"] {
      flex-direction: column;
    }
    &[data-orientation="horizontal"] {
      flex-direction: row;
      min-height: 296px;
      --_openui-stacked-legend-chart-flex: 1;
      --_openui-stacked-legend-panel-flex: 1;
      --_openui-stacked-legend-panel-min-width: 0;
      --_openui-stacked-legend-panel-height: 296px;
      --_openui-stacked-legend-panel-align: center;
      --_openui-stacked-legend-root-justify-content: center;
      --_openui-stacked-legend-list-height: auto;
      --_openui-stacked-legend-list-max-height: 100%;
    }
  `,
  chart: css`
    width: 100%;
    min-width: 0;
    flex: var(--_openui-stacked-legend-chart-flex, 0 1 auto);
  `,
  legend: css`
    display: flex;
    justify-content: center;
    width: 100%;
    flex: var(--_openui-stacked-legend-panel-flex, 0 1 auto);
    min-width: var(--_openui-stacked-legend-panel-min-width, auto);
    height: var(--_openui-stacked-legend-panel-height, auto);
    align-items: var(--_openui-stacked-legend-panel-align, flex-start);
  `,
};
