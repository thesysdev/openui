import { css } from "@openuidev/react-components";

/*
 * The Sources panel on react-ui's theme: colours, type, spacing and radii are openui tokens.
 *
 * Goober (under react-components' css) splits selectors at commas and mangles a pseudo-class
 * right after ")" or parentheses inside parentheses, so selectors here avoid all three.
 *
 * Motion: an occasional drawer (240ms, drawer curve) and frequent rows (200ms, strong ease-out);
 * a new pick fades without moving; reduced motion keeps fades only.
 */

const typography = (token: string, variation: "regular" | "medium") => `
  font: var(--${token});
  letter-spacing: var(--${token}-letter-spacing);
  font-variation-settings: var(--openui-font-variation-${variation});
`;
const bodySmall = typography("openui-text-body-sm", "regular");
const bodyHeavy = typography("openui-text-body-default-heavy", "medium");
const labelSmall = typography("openui-text-label-sm", "regular");
const labelSmallHeavy = typography("openui-text-label-sm-heavy", "medium");
const codeSmall = typography("openui-text-code-sm", "regular");

/** The animate skill's curves: strong ease-out for UI, the iOS drawer curve for panels. */
const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
const easeDrawer = "cubic-bezier(0.32, 0.72, 0, 1)";

const primary = "var(--openui-text-neutral-primary)";
const secondary = "var(--openui-text-neutral-secondary)";
const border = "var(--openui-border-default)";
const focusRing = "2px solid var(--openui-interactive-accent-default)";
const buttonReset = `
  padding: 0;
  border: 0;
  background: transparent;
`;
const cell = `
  padding: var(--openui-space-m);
  border-bottom: 1px solid ${border};
  text-align: left;
  white-space: nowrap;
`;
const overlayShadow = `0 0 0 1px ${border}, var(--openui-shadow-xl)`;
const ring = `color-mix(in srgb, ${primary} 55%, transparent)`;

/** Stable class names, to target from your own CSS. */
export const block = "openui-data-sources-panel";
const part = (name: string) => `${block}__${name}`;

export const panelStyles = {
  root: css`
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 320px;
    height: 100%;
    min-height: 0;
    background: var(--openui-background);
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
    min-height: 44px;
    box-sizing: border-box;
    padding: var(--openui-space-xs) var(--openui-space-xs) var(--openui-space-xs)
      var(--openui-space-m);
    border-bottom: 1px solid ${border};
    &:has(> .${part("icon-button")}:first-child) {
      padding-left: var(--openui-space-xs);
    }
  `,
  title: css`
    flex: 1;
    margin: 0;
    ${bodyHeavy}
    &:focus {
      outline: none;
    }
  `,
  close: css`
    margin-left: auto;
  `,
  // react-ui's small tertiary IconButton: 32px, 6px corners.
  "icon-button": css`
    ${buttonReset}
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--openui-radius-s);
    color: ${primary};
    cursor: pointer;
    transition: background-color 120ms ease;
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: 2px;
    }
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: var(--openui-highlight);
      }
    }
  `,
  body: css`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--openui-space-2xs) var(--openui-space-m) var(--openui-space-xl);
    overscroll-behavior: contain;
    scrollbar-width: thin;
  `,
  view: css`
    &:focus {
      outline: none;
    }
    @media (prefers-reduced-motion: no-preference) {
      transition: opacity 150ms ${easeOut};
      @starting-style {
        opacity: 0;
      }
    }
  `,
  help: css`
    margin: var(--openui-space-m) 0 0;
    color: ${secondary};
    ${bodySmall}
  `,

  // ── Every query ──
  list: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: var(--openui-space-2xs) calc(-1 * var(--openui-space-s)) 0;
    padding: 0;
    list-style: none;
  `,
  "list-row": css`
    display: flex;
    align-items: center;
    gap: var(--openui-space-m);
    min-height: 40px;
    padding: 0 var(--openui-space-s);
    border-radius: var(--openui-radius-m);
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
    gap: var(--openui-space-xs);
    color: ${secondary};
    ${labelSmall}
  `,
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

  // ── A pick: Query, Result and Formula rows ──
  rows: css`
    display: flex;
    flex-direction: column;
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
    min-height: 44px;
    color: ${primary};
    text-align: left;
    cursor: pointer;
    border-radius: var(--openui-radius-s);
    ${bodySmall}
    &:focus-visible {
      outline: ${focusRing};
      outline-offset: 2px;
    }
    &[aria-expanded="true"] > .${part("chevron")} {
      rotate: 90deg;
    }
    @media (hover: hover) and (pointer: fine) {
      &:hover > .${part("chevron")} {
        color: ${primary};
      }
    }
  `,
  "row-title": css`
    flex: 1;
  `,
  "row-note": css`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${secondary};
    font-variant-numeric: tabular-nums;
    ${labelSmall}
  `,
  chevron: css`
    flex: none;
    color: ${secondary};
    @media (prefers-reduced-motion: no-preference) {
      transition:
        rotate 150ms ${easeOut},
        color 120ms ease;
    }
  `,
  // Opens to its content's height: the one place layout animates, as an accordion must.
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
        grid-template-rows 200ms ${easeOut},
        opacity 150ms ${easeOut};
    }
    @media (prefers-reduced-motion: reduce) {
      transition: opacity 150ms;
    }
  `,
  "disclosure-inner": css`
    min-height: 0;
    overflow: hidden;
  `,
  "row-body": css`
    padding: 0 0 var(--openui-space-m);
  `,

  // ── Code ──
  "code-wrap": css`
    position: relative;
  `,
  code: css`
    margin: 0;
    max-height: 320px;
    overflow: auto;
    padding: var(--openui-space-m) 44px var(--openui-space-m) var(--openui-space-m);
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-foreground);
    color: ${primary};
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    ${codeSmall}
  `,
  "code-copy": css`
    position: absolute;
    top: var(--openui-space-xs);
    right: var(--openui-space-xs);
  `,
  swap: css`
    display: grid;
    place-items: center;
    @media (prefers-reduced-motion: no-preference) {
      transition:
        opacity 120ms ${easeOut},
        scale 120ms ${easeOut};
      @starting-style {
        opacity: 0;
        scale: 0.9;
      }
    }
  `,

  // ── Data: react-ui's Table look ──
  "table-scroll": css`
    max-height: 360px;
    overflow: auto;
    border: 1px solid ${border};
    border-radius: var(--openui-radius-2xl);
    background: var(--openui-foreground);
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
      background: var(--openui-foreground);
      color: ${secondary};
      ${labelSmallHeavy}
    }
    & [data-numeric] {
      text-align: right;
    }
    & tbody tr:last-child td {
      border-bottom: 0;
    }
  `,
  raw: css`
    margin: 0;
    max-height: 360px;
    overflow: auto;
    padding: var(--openui-space-m);
    border: 1px solid ${border};
    border-radius: var(--openui-radius-m);
    background: var(--openui-foreground);
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
    gap: var(--openui-space-2xs);
    margin-top: var(--openui-space-s);
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
    /* The selection: a neutral ring close around it. In :where(), as in
       cloudArtifact.styles.ts, so the app CSS the docs describe still wins. */
    & :where(.openui-artifact-content [data-openui-selected]) {
      outline: 1.5px solid ${ring};
      outline-offset: 2px;
      border-radius: var(--openui-radius-2xs);
    }
    /* A picked number's card is context, not the selection: only the number is ringed. The
       dock marks that card (goober can't take a :has() inside :where()). */
    & :where(.openui-artifact-content [data-openui-context]) {
      outline: none;
    }
  `,
  /* Docked beside the content; the content snaps to its new width, the panel slides. */
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
      visibility: hidden;
    }
    &[data-open="true"] > .${block} {
      transform: translateX(0);
      visibility: visible;
    }
    @media (prefers-reduced-motion: no-preference) {
      & > .${block} {
        transition:
          transform 240ms ${easeDrawer},
          visibility 0s 240ms;
      }
      &[data-open="true"] > .${block} {
        transition:
          transform 240ms ${easeDrawer},
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

    /* Phones: a bottom sheet that slides up its own height, low enough to tap the dashboard. */
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
        padding-top: var(--openui-space-m);
        border-left: 0;
        border-radius: var(--openui-radius-3xl) var(--openui-radius-3xl) 0 0;
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
        background: var(--openui-text-neutral-tertiary);
      }
      &[data-open="true"] > .${block} {
        transform: translateY(0);
      }
    }
    @media (max-width: 639px) and (prefers-reduced-motion: no-preference) {
      & > .${block} {
        transition:
          transform 300ms ${easeDrawer},
          visibility 0s 300ms;
      }
      &[data-open="true"] > .${block} {
        transition:
          transform 300ms ${easeDrawer},
          visibility 0s;
      }
    }
  `,
};
