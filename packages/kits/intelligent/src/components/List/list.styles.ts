import { css } from "goober";
import { tokens } from "../../shared/tokens";

export const names = {
  root: "openui-intelligent-list",
  marker: {
    bullet: "openui-intelligent-list--marker-bullet",
    number: "openui-intelligent-list--marker-number",
    none: "openui-intelligent-list--marker-none",
  },
  timeline: "openui-intelligent-list--timeline",
  wide: "openui-intelligent-list--wide",
  row: "openui-intelligent-list-row",
  rich: "openui-intelligent-list-row--rich",
  markerCell: "openui-intelligent-list-marker",
  markerKind: {
    hidden: "openui-intelligent-list-marker--kind-hidden",
    dot: "openui-intelligent-list-marker--kind-dot",
    number: "openui-intelligent-list-marker--kind-number",
    chip: "openui-intelligent-list-marker--kind-chip",
    text: "openui-intelligent-list-marker--kind-text",
  },
  chip: "openui-intelligent-list-marker-chip",
  body: "openui-intelligent-list-body",
  title: "openui-intelligent-list-title",
  description: "openui-intelligent-list-description",
  children: "openui-intelligent-list-children",
} as const;

const RING = `inset 0 0 0 2px ${tokens.ink}`;

/**
 * Bullets, numbers or no marker; a per-item marker (a time, an emoji, a step letter); and a timeline
 * that joins the markers. The root's layout and spacing classes set private variables that its rows
 * and markers read. A nested list always sets its own, so nothing leaks into it.
 */
export const styles = {
  root: css`
    --_openui-intelligent-strong-weight: 640;
    display: flex;
    flex-direction: column;
    gap: var(--_openui-intelligent-list-gap, 10px);
    margin: 0;
    padding: 0;
    list-style: none;
  `,
  /* How wide the marker lane is, and what separates it from the text. */
  layout: {
    stack: css`
      --_openui-intelligent-list-columns: minmax(0, 1fr);
      --_openui-intelligent-list-column-gap: 12px;
    `,
    dots: css`
      --_openui-intelligent-list-columns: 14px minmax(0, 1fr);
      --_openui-intelligent-list-column-gap: 8px;
    `,
    lane: css`
      --_openui-intelligent-list-columns: 24px minmax(0, 1fr);
      --_openui-intelligent-list-column-gap: 12px;
    `,
    wide: css`
      --_openui-intelligent-list-columns: 76px minmax(0, 1fr);
      --_openui-intelligent-list-column-gap: 16px;
      @media (max-width: 640px) {
        --_openui-intelligent-list-columns: 64px minmax(0, 1fr);
        --_openui-intelligent-list-column-gap: 20px;
      }
    `,
    wideTimeline: css`
      --_openui-intelligent-list-columns: 76px minmax(0, 1fr);
      --_openui-intelligent-list-column-gap: 24px;
      --_openui-intelligent-list-line-left: auto;
      --_openui-intelligent-list-line-right: calc(100% - 76px - 8px);
      --_openui-intelligent-list-time-dot-left: calc(76px + 4px);
      @media (max-width: 640px) {
        --_openui-intelligent-list-columns: 64px minmax(0, 1fr);
        --_openui-intelligent-list-column-gap: 20px;
        --_openui-intelligent-list-line-right: calc(100% - 64px - 10px);
        --_openui-intelligent-list-time-dot-left: calc(64px + 6px);
      }
    `,
  },
  spacing: {
    plain: css`
      --_openui-intelligent-list-gap: 10px;
      --_openui-intelligent-list-dot-size: 5px;
      --_openui-intelligent-list-dot-background: ${tokens.faint};
      --_openui-intelligent-list-dot-ring: none;
    `,
    timeline: css`
      --_openui-intelligent-list-gap: 0;
      --_openui-intelligent-list-dot-size: 9px;
      --_openui-intelligent-list-dot-background: ${tokens.canvas};
      --_openui-intelligent-list-dot-ring: ${RING};
    `,
  },
  row: css`
    position: relative;
    display: grid;
    grid-template-columns: var(--_openui-intelligent-list-columns, 24px minmax(0, 1fr));
    column-gap: var(--_openui-intelligent-list-column-gap, 12px);
    align-items: start;
  `,
  /* A rich row's titles are medium, however deep they are nested. */
  rich: css`
    --_openui-intelligent-list-title-weight: 560;
  `,
  richSpacing: css`
    padding-bottom: 4px;
  `,
  timelineRow: css`
    padding-bottom: 18px;
    &:last-child {
      padding-bottom: 0;
    }
  `,
  line: css`
    &::after {
      content: "";
      position: absolute;
      top: 1.7em;
      bottom: 0.15em;
      left: var(--_openui-intelligent-list-line-left, 11.5px);
      right: var(--_openui-intelligent-list-line-right, auto);
      width: 1px;
      background: ${tokens.borderStrong};
    }
    &:last-child::after {
      content: none;
    }
  `,
  markerCell: css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 1.55em;
    color: ${tokens.muted};
  `,
  markerKind: {
    hidden: css`
      display: none;
    `,
    dot: css`
      &::before {
        content: "";
        width: var(--_openui-intelligent-list-dot-size, 5px);
        height: var(--_openui-intelligent-list-dot-size, 5px);
        border-radius: 50%;
        background: var(--_openui-intelligent-list-dot-background, ${tokens.faint});
        box-shadow: var(--_openui-intelligent-list-dot-ring, none);
      }
    `,
    number: css`
      align-self: start;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${tokens.ink};
      color: ${tokens.onInk};
      font-size: 13px;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    `,
    text: css`
      justify-content: flex-start;
      color: ${tokens.muted};
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    `,
  },
  /* On a timeline with a text lane, the dot sits just past the time. */
  timeDot: css`
    &::after {
      content: "";
      position: absolute;
      left: var(--_openui-intelligent-list-time-dot-left, calc(76px + 4px));
      top: 0.55em;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: ${tokens.canvas};
      box-shadow: ${RING};
    }
  `,
  /* Short custom markers ("1", "2", "A") read as steps: white numerals on an ink chip. */
  chip: css`
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 999px;
    background: ${tokens.ink};
    color: ${tokens.onInk};
    font-size: 12px;
    line-height: 1;
    font-weight: 560;
    font-variant-numeric: tabular-nums;
  `,
  title: css`
    font-weight: var(--_openui-intelligent-list-title-weight, inherit);
  `,
  description: css`
    margin-top: 2px;
    color: ${tokens.muted};
    font-size: 0.93em;
    line-height: 1.55;
  `,
  children: css`
    margin-top: 8px;
  `,
};
