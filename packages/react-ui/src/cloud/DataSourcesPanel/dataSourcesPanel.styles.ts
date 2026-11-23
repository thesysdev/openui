import { css, keyframes } from "@openuidev/react-components";

/*
 * The Sources panel, after OpenDashboards' design: a quiet 320px column. One left edge; titles,
 * rows, code and data all start at the body's 16px inset, and row hover fills reach 10px past it.
 * Nothing is boxed except code and data. Colours, type and radii come from the openui theme.
 */

const typography = (token: string, variation: "regular" | "medium") => `
  font: var(--${token});
  letter-spacing: var(--${token}-letter-spacing);
  font-variation-settings: var(--openui-font-variation-${variation});
`;
const bodySmall = typography("openui-text-body-sm", "regular");
const bodySmallHeavy = typography("openui-text-body-sm-heavy", "medium");
const labelSmall = typography("openui-text-label-sm", "regular");
const labelDefault = typography("openui-text-label-default", "regular");
const labelHeavy = typography("openui-text-label-default-heavy", "medium");
const codeSmall = typography("openui-text-code-sm", "regular");
const numberHeading = typography("openui-text-numbers-heading-sm", "medium");

const ease = "cubic-bezier(0.2, 0, 0, 1)";
const primary = "var(--openui-text-neutral-primary)";
const secondary = "var(--openui-text-neutral-secondary)";
const border = "var(--openui-border-default)";
const focusRing = "2px solid var(--openui-border-accent-emphasis)";
/** sunk-light is a tint: laid on the solid background, so a floating panel is opaque. */
const panelBackground =
  "linear-gradient(var(--openui-sunk-light), var(--openui-sunk-light)), var(--openui-background)";
const cell = `
  padding: 5px 12px;
  border-bottom: 1px solid var(--openui-border-default);
  text-align: left;
  white-space: nowrap;
`;
const buttonReset = `
  padding: 0;
  border: 0;
  background: transparent;
`;
const overlayShadow = `0 0 0 1px ${border},
  0 4px 8px -4px color-mix(in srgb, ${primary} 10%, transparent),
  0 12px 32px -8px color-mix(in srgb, ${primary} 14%, transparent)`;
const dots = `color-mix(in srgb, ${primary} 26%, transparent)`;
const dotsHover = `color-mix(in srgb, ${primary} 55%, transparent)`;
const solid = `color-mix(in srgb, ${primary} 55%, transparent)`;

/*
 * Goober mangles a selector with a pseudo-class right after ")" (":not(…):hover") or parentheses
 * inside parentheses (":not(:has(…))"), and splits at every comma. So these use one level of
 * parentheses, no commas, and the dock marks what to frame (data-openui-frame) in JS.
 */
/** A marked number that isn't selected. */
const unpickedNumber = "[data-openui-prop]:not([data-openui-selected])";
const hoveredNumber = "[data-openui-prop]:hover:not([data-openui-selected])";
const flaggedNumber = "[data-openui-prop][data-openui-hover]:not([data-openui-selected])";
/** A component that frames itself (holds no other component and no number), unselected. */
const frameable = "[data-openui-frame]:not([data-openui-selected])";
const hoveredFrame = "[data-openui-frame][data-openui-hover]:not([data-openui-selected])";
const cardOfPicked = "[data-openui-selected]:has([data-openui-prop][data-openui-selected])";
const dottedUnderline = `
  cursor: pointer;
  text-decoration: underline dotted ${dots};
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
  text-decoration-skip-ink: none;
`;
const darkerUnderline = `
  text-decoration-color: ${dotsHover};
  outline: none;
`;
const pickedBox = `
  outline: 1.5px solid ${solid};
  outline-offset: 2px;
  border-radius: 3px;
  text-decoration: none;
`;

/** Stable class names, to target from your own CSS. */
export const block = "openui-data-sources-panel";
const part = (name: string) => `${block}__${name}`;

const arrive = keyframes`
  from {
    background-color: var(--openui-highlight);
  }
  to {
    background-color: transparent;
  }
`;

export const panelStyles = {
  root: css`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 320px;
    height: 100%;
    min-height: 0;
    background: ${panelBackground};
    border-left: 1px solid ${border};
    color: ${primary};
    ${bodySmall}
    & code {
      ${codeSmall}
    }
  `,
  header: css`
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--openui-space-s);
    height: 48px;
    padding: 0 10px 0 var(--openui-space-m);
    border-bottom: 1px solid ${border};
    ${labelHeavy}
    &:has(> .${part("icon-button")}:first-child) {
      padding-left: 10px;
    }
  `,
  close: css`
    margin-left: auto;
  `,
  "icon-button": css`
    ${buttonReset}
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: var(--openui-radius-s);
    color: ${secondary};
    cursor: pointer;
    &:hover {
      background: var(--openui-highlight-subtle);
      color: ${primary};
    }
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: -2px;
    }
  `,
  body: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--openui-space-m) var(--openui-space-m) 32px;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  `,
  title: css`
    margin: 0;
    overflow-wrap: anywhere;
    ${bodySmallHeavy}
    /* Focus moves here for screen readers; it is not a control, so no ring. */
    &:focus {
      outline: none;
    }
  `,
  meta: css`
    margin: 2px 0 0;
    color: ${secondary};
    text-wrap: pretty;
    ${bodySmall}
  `,
  help: css`
    margin: 0;
    color: ${secondary};
    ${bodySmall}
  `,

  // ── The list ──
  "search-bar": css`
    position: sticky;
    top: calc(-1 * var(--openui-space-m));
    z-index: 1;
    margin: calc(-1 * var(--openui-space-m)) calc(-1 * var(--openui-space-m)) 4px;
    padding: 12px var(--openui-space-m) var(--openui-space-s);
    background: ${panelBackground};
  `,
  search: css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-s);
    padding: 7px 10px;
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    color: ${secondary};
    &:focus-within {
      border-color: var(--openui-border-interactive-emphasis);
    }
    & input {
      width: 100%;
      min-width: 0;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: ${primary};
      ${bodySmall}
    }
  `,
  list: css`
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin: 0 -10px;
    padding: 0;
    list-style: none;
  `,
  "list-row": css`
    ${buttonReset}
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border-radius: var(--openui-radius-m);
    color: ${primary};
    text-align: left;
    cursor: pointer;
    ${bodySmall}
    &:hover {
      background: var(--openui-highlight-subtle);
    }
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: -2px;
    }
    &[data-active] {
      background: var(--openui-highlight);
    }
    &[data-active] > .${part("list-kind")} {
      color: ${primary};
    }
  `,
  "list-label": css`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  "list-kind": css`
    display: flex;
    flex: none;
    align-items: center;
    color: ${secondary};
    ${labelSmall}
  `,

  // ── Source marks: the app's icon or a glyph, 14px, muted ──
  mark: css`
    display: inline-flex;
    flex: none;
    width: 14px;
    height: 14px;
    color: ${secondary};
    & > svg {
      width: 14px;
      height: 14px;
    }
  `,
  "mark-stack": css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 2px;
  `,

  // ── A detail: what was picked, then equal collapsible rows divided by hairlines ──
  focus: css`
    margin: var(--openui-space-m) -10px 0;
    padding: var(--openui-space-s) 10px;
    border-radius: var(--openui-radius-m);
    @media (prefers-reduced-motion: no-preference) {
      animation: ${arrive} 900ms ${ease} both;
    }
  `,
  "focus-heading": css`
    margin-top: calc(-1 * var(--openui-space-s));
  `,
  "focus-value": css`
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
    ${numberHeading}
  `,
  "focus-label": css`
    margin-top: 2px;
    color: ${secondary};
    text-wrap: pretty;
    ${bodySmall}
  `,
  "focus-hint": css`
    margin-top: 2px;
    color: ${secondary};
    ${labelSmall}
  `,
  rows: css`
    margin-top: 12px;
    border-top: 1px solid ${border};
  `,
  row: css`
    border-bottom: 1px solid ${border};
  `,
  "row-toggle": css`
    ${buttonReset}
    display: flex;
    align-items: center;
    gap: var(--openui-space-s);
    width: 100%;
    height: 44px;
    color: ${primary};
    text-align: left;
    cursor: pointer;
    ${bodySmall}
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: 2px;
      border-radius: var(--openui-radius-s);
    }
    &:hover > .${part("chevron")} {
      color: ${primary};
    }
    &[aria-expanded="true"] > .${part("chevron")} {
      rotate: 90deg;
    }
  `,
  "row-title": css`
    display: flex;
    flex: 1;
    min-width: 0;
    align-items: center;
    gap: var(--openui-space-s);
  `,
  "row-note": css`
    color: ${secondary};
    font-variant-numeric: tabular-nums;
    ${labelSmall}
  `,
  chevron: css`
    flex: none;
    color: ${secondary};
    @media (prefers-reduced-motion: no-preference) {
      transition:
        rotate 150ms ${ease},
        color 150ms;
    }
  `,
  disclosure: css`
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    &[data-open="true"] {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    @media (prefers-reduced-motion: no-preference) {
      transition:
        grid-template-rows 180ms ${ease},
        opacity 120ms;
    }
  `,
  // The disclosure clips to animate; widen it so row hover fills keep their 10px bleed.
  "disclosure-inner": css`
    min-height: 0;
    overflow: hidden;
    margin-inline: -10px;
    padding-inline: 10px;
  `,
  // What a row holds sits 4px in from its label, so it reads as belonging to it.
  "row-body": css`
    padding: 0 0 var(--openui-space-m) 4px;
    & > .${part("list")} {
      margin-top: -4px;
    }
  `,

  // ── Code ──
  "code-wrap": css`
    position: relative;
    &:hover > .${part("code-copy")} {
      opacity: 1;
    }
    &:focus-within > .${part("code-copy")} {
      opacity: 1;
    }
  `,
  code: css`
    margin: 0;
    max-height: 320px;
    overflow: auto;
    padding: 10px 40px 10px 12px;
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    color: ${primary};
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    ${codeSmall}
  `,
  "code-copy": css`
    position: absolute;
    top: 4px;
    right: 4px;
    opacity: 0;
    @media (prefers-reduced-motion: no-preference) {
      transition: opacity 150ms;
    }
  `,

  // ── Data: compact rows in one hairline box, raw field names, tabular figures ──
  identity: css`
    display: flex;
    align-items: center;
    margin: -4px -6px 6px 0;
  `,
  "identity-name": css`
    ${buttonReset}
    flex: 1;
    min-width: 0;
    padding: 4px 0;
    overflow: hidden;
    color: ${primary};
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    ${bodySmallHeavy}
    &:hover {
      text-decoration: underline;
      text-decoration-color: var(--openui-border-interactive-emphasis);
      text-underline-offset: 3px;
    }
  `,
  "table-scroll": css`
    max-height: 320px;
    overflow: auto;
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    overscroll-behavior: contain;
    scrollbar-width: thin;
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: 2px;
    }
  `,
  table: css`
    width: max-content;
    min-width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-variant-numeric: tabular-nums;
    ${bodySmall}
    & th {
      ${cell}
    }
    & td {
      ${cell}
    }
    & th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: var(--openui-background);
      ${bodySmallHeavy}
    }
    & tbody tr:last-child td {
      border-bottom: 0;
    }
  `,
  fields: css`
    margin: 0;
    padding: 0 12px;
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    & > div {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: baseline;
      gap: 12px;
      padding: 5px 0;
      border-bottom: 1px solid ${border};
    }
    & > div:last-child {
      border-bottom: 0;
    }
    & dt {
      color: ${secondary};
      overflow-wrap: anywhere;
    }
    & dd {
      margin: 0;
      min-width: 0;
      text-align: right;
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }
  `,
  raw: css`
    margin: 0;
    max-height: 360px;
    overflow: auto;
    padding: 10px 12px;
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-background);
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    ${codeSmall}
  `,
  null: css`
    color: ${secondary};
  `,
  "result-foot": css`
    display: flex;
    align-items: center;
    margin: 6px -6px 0 0;
    color: ${secondary};
    font-variant-numeric: tabular-nums;
    ${labelSmall}
    & > span {
      flex: 1;
    }
  `,
  "sr-only": css`
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `,
};

export type PanelPart = Exclude<keyof typeof panelStyles, "root">;

/** A part's classes: its style, and its stable name. */
export const partClass = (name: PanelPart) => `${panelStyles[name]} ${part(name)}`;

// ── In a live artifact: the panel docks beside the content ──

export const dockNames = {
  workspace: "openui-data-sources-workspace",
  slot: "openui-data-sources-slot",
  tip: "openui-data-sources-tip",
  chip: "openui-data-sources-chip",
} as const;

export const dockStyles = {
  workspace: css`
    position: relative;
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 120px;
    overflow: clip;
    container-type: inline-size;
    & > .openui-artifact-content {
      flex: 1;
      min-width: 0;
    }

    /* While inspecting, every traceable thing advertises itself: numbers get a dotted underline,
       components a dotted frame 4px outside. The selected one turns solid; hover darkens the dots.
       A component holding another, or holding a marked number, never frames itself. */
    &[data-inspecting] ${unpickedNumber} {
      ${dottedUnderline}
    }
    &[data-inspecting] ${hoveredNumber} {
      ${darkerUnderline}
    }
    &[data-inspecting] ${flaggedNumber} {
      ${darkerUnderline}
    }
    &[data-inspecting] ${frameable} {
      cursor: pointer;
      outline: 1.5px dotted ${dots};
      outline-offset: 4px;
      border-radius: 2px;
    }
    &[data-inspecting] ${hoveredFrame} {
      outline-color: ${dotsHover};
    }
    /* A card around a marked number is context: the number shows the hover, not the card. */
    &[data-inspecting] [data-openui-hover]:has([data-openui-prop]) {
      outline: none;
    }

    & .openui-artifact-content [data-openui-selected]:not([data-openui-prop]) {
      outline: 1.5px solid ${solid};
      outline-offset: 4px;
      border-radius: 2px;
    }
    /* A picked figure: a close box around the number itself. */
    & .openui-artifact-content [data-openui-prop][data-openui-selected] {
      ${pickedBox}
    }
    & .openui-artifact-content [data-openui-picked] {
      ${pickedBox}
    }
    /* Its card is the context, not the selection: no frame around it. */
    & .openui-artifact-content ${cardOfPicked} {
      outline: none;
    }
  `,
  slot: css`
    position: relative;
    z-index: 20;
    flex: none;
    width: 0;
    min-height: 0;
    pointer-events: none;
    &[data-open="true"] {
      width: 320px;
      pointer-events: auto;
    }
    & > .${block} {
      position: absolute;
      inset: 0 0 0 auto;
      width: 320px;
      transform: translateX(100%);
      opacity: 0;
      visibility: hidden;
    }
    &[data-open="true"] > .${block} {
      transform: translateX(0);
      opacity: 1;
      visibility: visible;
    }
    @media (prefers-reduced-motion: no-preference) {
      & > .${block} {
        transition:
          transform 180ms ${ease},
          opacity 140ms,
          visibility 0s 180ms;
      }
      &[data-open="true"] > .${block} {
        transition:
          transform 180ms ${ease},
          opacity 140ms,
          visibility 0s;
      }
    }

    /* Narrow artifact: the panel floats over the content instead of narrowing it. */
    @container (max-width: 760px) {
      &[data-open] {
        position: absolute;
        inset: 0 0 0 auto;
        width: min(320px, 100%);
      }
      & > .${block} {
        width: 100%;
        box-shadow: ${overlayShadow};
      }
    }

    /* Phones: a bottom sheet, low enough that the dashboard stays tappable above it. */
    @media (max-width: 639px) {
      &[data-open] {
        position: fixed;
        inset: auto 0 0 0;
        width: 100%;
        height: min(62dvh, 600px);
        z-index: 45;
      }
      & > .${block} {
        inset: 0;
        width: 100%;
        padding-top: 10px;
        border-left: 0;
        border-radius: 16px 16px 0 0;
        box-shadow: ${overlayShadow};
        transform: translateY(100%);
      }
      & > .${block}::before {
        content: "";
        position: absolute;
        top: 6px;
        left: 50%;
        width: 36px;
        height: 4px;
        margin-left: -18px;
        border-radius: var(--openui-radius-full);
        background: color-mix(in srgb, ${primary} 18%, transparent);
      }
      &[data-open="true"] > .${block} {
        transform: translateY(0);
      }
    }
  `,
  /** The pointer label: the app's tooltip look, following the pointer. */
  tip: css`
    position: fixed;
    z-index: 60;
    translate: -50% calc(-100% - 14px);
    padding: 6px 12px;
    border-radius: var(--openui-radius-m);
    background: var(--openui-inverted-background);
    color: var(--openui-background);
    white-space: nowrap;
    pointer-events: none;
    ${labelSmall}
  `,
  /** "See source", offered when a number is clicked with Sources closed. */
  chip: css`
    position: fixed;
    z-index: 50;
    display: flex;
    align-items: center;
    padding: 3px;
    border-radius: var(--openui-radius-l);
    background: var(--openui-popover-background);
    box-shadow: ${overlayShadow};
    & > button {
      ${buttonReset}
      display: flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 10px 0 8px;
      border-radius: var(--openui-radius-s);
      color: ${primary};
      cursor: pointer;
      ${labelDefault}
    }
    & > button > svg {
      color: ${secondary};
    }
    & > button:hover {
      background: var(--openui-highlight-subtle);
    }
  `,
};
