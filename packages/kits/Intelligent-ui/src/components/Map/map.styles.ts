import { css, keyframes } from "goober";
import { tokens } from "../../shared/tokens";

const pinIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.75);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

export const names = {
  slot: "openui-intelligent-map-slot",
  root: "openui-intelligent-map",
  surface: "openui-intelligent-map-surface",
  topLeft: "openui-intelligent-map-top-left",
  pill: "openui-intelligent-map-pill",
  filter: "openui-intelligent-map-filter",
  select: "openui-intelligent-map-select",
  filterIcon: "openui-intelligent-map-filter-icon",
  recenter: "openui-intelligent-map-recenter",
  recenterIcon: "openui-intelligent-map-recenter-icon",
  info: "openui-intelligent-map-info",
  infoIcon: "openui-intelligent-map-info-icon",
  expand: "openui-intelligent-map-expand",
  expandIcon: "openui-intelligent-map-expand-icon",
  marker: "openui-intelligent-map-marker",
  markerContent: "openui-intelligent-map-marker-content",
  pin: "openui-intelligent-map-pin",
  label: "openui-intelligent-map-label",
  note: "openui-intelligent-map-note",
  error: "openui-intelligent-map-error",
  overview: "openui-intelligent-map-overview",
  status: "openui-intelligent-map-status",
} as const;

const SURFACE = `.${names.surface}`;

/** Controls float over the map as frosted glass: translucent canvas, 12px blur, a white hairline and a soft shadow. */
const GLASS = `
  background: ${tokens.glass};
  backdrop-filter: blur(12px) saturate(1.4);
  box-shadow: inset 0 0 0 1px ${tokens.glassRing}, 0 2px 12px rgb(0 0 0 / 8%);
`;

const GLASS_CONTROL = `
  ${GLASS}
  transition: background-color 120ms ease-out, box-shadow 120ms ease-out;
  &:hover {
    background: ${tokens.glassHover};
    box-shadow: inset 0 0 0 1px ${tokens.glassRingHover}, 0 2px 14px rgb(0 0 0 / 10%);
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const FLOATING_NOTE = `
  position: absolute;
  top: 56px;
  left: 12px;
  z-index: 500;
  max-width: 275px;
  padding: 12px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusLg};
  background: ${tokens.canvas};
  color: ${tokens.muted};
  box-shadow: ${tokens.shadow};
  font-size: 12px;
  line-height: 18px;
`;

/**
 * The root's rules on .maplibregl-* are not flat, because maplibre renders that DOM. The surface
 * doubles its class to beat maplibre-gl.css, which sets .maplibregl-map to position: relative.
 */
export const styles = {
  slot: css`
    width: 100%;
    min-width: 0;
  `,
  root: css`
    position: relative;
    overflow: hidden;
    border-radius: ${tokens.radius2xl};
    background: ${tokens.mapWater};
    isolation: isolate;
    &[aria-modal="true"] {
      position: fixed;
      inset: 24px;
      z-index: 1500;
      height: auto;
      outline: 24px solid color-mix(in srgb, ${tokens.canvas} 90%, transparent);
      box-shadow: 0 12px 64px rgb(0 0 0 / 18%);
      @media (max-width: 520px) {
        inset: 12px;
        outline-width: 12px;
      }
    }
    & ${SURFACE} .maplibregl-ctrl-attrib {
      max-width: calc(100% - 50px);
      padding: 1px 4px;
      background: color-mix(in srgb, ${tokens.canvas} 90%, transparent);
      color: ${tokens.muted};
      font-size: 8px;
      line-height: 10px;
    }
    & ${SURFACE} .maplibregl-ctrl-attrib a {
      color: ${tokens.muted};
    }
    & ${SURFACE} .maplibregl-ctrl-group {
      overflow: hidden;
      border: 0;
      border-radius: 10px;
      ${GLASS}
      opacity: 0;
      transition: opacity 0.15s ease;
    }
    & ${SURFACE} .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
      filter: var(--_openui-intelligent-map-control-icon-filter, none);
    }
    &:hover .maplibregl-ctrl-group,
    &:focus-within .maplibregl-ctrl-group {
      opacity: 1;
    }
    & ${SURFACE} .maplibregl-ctrl-group button {
      width: 28px;
      height: 28px;
    }
    & :focus-visible {
      outline: 2px solid ${tokens.focus};
      outline-offset: 3px;
    }
  `,
  surface: css`
    && {
      position: absolute;
      inset: 0;
      z-index: 0;
      background: ${tokens.mapWater};
    }
  `,
  topLeft: css`
    position: absolute;
    z-index: 500;
    top: 12px;
    left: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,
  pill: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding: 6px 12px;
    border: 1px solid transparent;
    border-radius: 999px;
    color: ${tokens.ink};
    font-size: 12px;
    line-height: 18px;
    font-weight: 560;
    cursor: pointer;
    ${GLASS_CONTROL}
  `,
  filter: css`
    position: relative;
    padding: 0;
  `,
  select: css`
    appearance: none;
    max-width: 180px;
    padding: 8px 30px 8px 12px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  `,
  filterIcon: css`
    position: absolute;
    right: 10px;
    width: 14px;
    height: 14px;
    pointer-events: none;
  `,
  recenter: css`
    width: 34px;
    height: 34px;
    padding: 6px;
    justify-content: center;
  `,
  recenterIcon: css`
    width: 22px;
    height: 22px;
  `,
  info: css`
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    color: ${tokens.ink};
    cursor: pointer;
    ${GLASS_CONTROL}
  `,
  infoIcon: css`
    width: 18px;
    height: 18px;
  `,
  expand: css`
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 500;
    min-height: 28px;
    padding: 4px 10px;
  `,
  expandIcon: css`
    width: 14px;
    height: 14px;
  `,
  marker: css`
    cursor: pointer;
  `,
  markerContent: css`
    position: relative;
    display: flex;
    width: 34px;
    flex-direction: column;
    align-items: center;
    animation: ${pinIn} 104ms cubic-bezier(0.2, 0.7, 0.3, 1) both;
    transform-origin: 50% 17px;
    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `,
  pin: css`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border: 1px solid ${tokens.glassRing};
    border-radius: 50%;
    background: ${tokens.canvas};
    box-shadow: 0 2px 10px rgb(0 0 0 / 14%);
    font-size: 18px;
    line-height: 1;
    &[data-numbered] {
      width: 26px;
      height: 26px;
      margin: 4px 0;
      border: 2px solid ${tokens.canvas};
      background: ${tokens.ink};
      color: ${tokens.onInk};
      font: 640 12px/1 ${tokens.font};
      font-variant-numeric: tabular-nums;
    }
    &[data-selected] {
      outline: 3px solid ${tokens.focus};
      outline-offset: 1px;
    }
  `,
  /* Labels sit on the map, so they keep a compact sans-serif and a halo in the canvas color. */
  label: css`
    display: block;
    max-width: 160px;
    margin-top: 3px;
    color: ${tokens.ink};
    font: 640 12px/15px Arial, Helvetica, sans-serif;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 2px ${tokens.canvas}, 0 -1px 2px ${tokens.canvas}, 1px 0 2px ${tokens.canvas}, -1px 0 2px ${tokens.canvas};
    @media (max-width: 520px) {
      max-width: 120px;
      font-size: 10px;
    }
  `,
  note: css`
    ${FLOATING_NOTE}
  `,
  error: css`
    ${FLOATING_NOTE}
    top: auto;
    bottom: 28px;
  `,
  overview: css`
    position: absolute;
    bottom: 22px;
    left: 12px;
    z-index: 500;
    padding: 2px 7px;
    border-radius: 6px;
    background: color-mix(in srgb, ${tokens.canvas} 92%, transparent);
    color: ${tokens.muted};
    font-size: 10px;
    line-height: 16px;
  `,
  status: css`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `,
};
