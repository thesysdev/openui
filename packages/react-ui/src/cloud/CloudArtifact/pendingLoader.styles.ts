import { css } from "goober";

/** Class names inside the pending loader. The engine builds its cards from them. */
export const pendingLoaderNames = {
  stage: "openui-artifact-pending-stage",
  container: "openui-artifact-pending-container",
  card: "openui-artifact-pending-card",
  body: "openui-artifact-pending-card-body",
  bone: "openui-artifact-pending-bone",
  title: "openui-artifact-pending-title",
  number: "openui-artifact-pending-number",
  fill: "openui-artifact-pending-fill",
  fade: "openui-artifact-pending-fade",
  area: "openui-artifact-pending-area",
  trend: "openui-artifact-pending-trend",
  bars: "openui-artifact-pending-bars",
  hbars: "openui-artifact-pending-hbars",
  ring: "openui-artifact-pending-ring",
  rows: "openui-artifact-pending-rows",
  note: "openui-artifact-pending-note",
} as const;

const n = pendingLoaderNames;
const ease = "cubic-bezier(0.7, 0, 0.2, 1)";

export const pendingLoaderStyles = {
  // Every color is `--openui-pending-color` (by default the text color it inherits, not a theme
  // token, so it follows the page even outside a ThemeProvider) at a low strength. A color passed
  // to `Pending` replaces its mix.
  root: css`
    --openui-pending-tint: var(--openui-pending-color, currentColor);
    --openui-pending-shape: color-mix(in srgb, var(--openui-pending-tint) 8%, transparent);
    --openui-pending-card: color-mix(in srgb, var(--openui-pending-tint) 3%, transparent);
    --openui-pending-border: color-mix(in srgb, var(--openui-pending-tint) 10%, transparent);
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    /* Fills a content area with a height, even a short one; on a page without one, the stage sets it. */
    height: 100%;
    padding: var(--openui-space-m);
  `,
  // A flex item, not `height: 100%`, which a page without a height can't resolve. There the
  // basis gives the root a dashboard's 400px; in a content area with a height, the stage grows
  // or shrinks to fit it. A `min-height` would beat that height and overflow a short strip.
  stage: css`
    position: relative;
    flex: 1 1 calc(400px - 2 * var(--openui-space-m, 0px));
    width: 100%;
    min-height: 0;
    overflow: hidden;

    /* The drawing, at its own size, scaled by the engine to fit and centred, like an SVG. */
    & .${n.container} {
      position: absolute;
      top: 50%;
      left: 50%;
      translate: -50% -50%;
      scale: var(--openui-pending-scale, 1);
    }
    & .${n.card} {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      box-sizing: border-box;
      overflow: hidden;
      /* Everything scales but the border, which stays a hairline, like a non-scaling stroke. */
      border: calc(1px / var(--openui-pending-scale, 1)) solid var(--openui-pending-border);
      border-radius: var(--openui-radius-l);
      background: var(--openui-pending-card);
      transition:
        translate 760ms ${ease},
        width 760ms ${ease},
        height 760ms ${ease};
    }
    @media (prefers-reduced-motion: reduce) {
      & .${n.card} {
        transition-duration: 0s;
      }
    }

    /* A card: a title bar and one shape. */
    & .${n.body} {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 16px;
    }
    & .${n.bone} {
      display: block;
      flex: none;
      width: var(--bw, 100%);
      height: 10px;
      border-radius: 6px;
      background: var(--openui-pending-shape);
    }
    & .${n.title} {
      height: 12px;
    }
    & .${n.number} {
      height: 30px;
      border-radius: 8px;
    }
    & .${n.fill} {
      flex: 1;
    }
    & .${n.fade} {
      -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent);
      mask-image: linear-gradient(to bottom, #000 70%, transparent);
    }
    & .${n.area} {
      display: block;
      flex: 1;
      width: 100%;
      min-height: 0;
    }
    & .${n.area} path {
      fill: var(--openui-pending-shape);
    }
    & .${n.trend} {
      overflow: visible;
    }
    & .${n.trend} path {
      fill: none;
      stroke: var(--openui-pending-shape);
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }
    & .${n.bars} {
      display: flex;
      flex: 1;
      align-items: flex-end;
      gap: 8px;
      min-height: 0;
    }
    & .${n.bars} i {
      flex: 1 1 0;
      min-width: 0;
      height: calc(var(--v) * 100%);
      border-radius: 6px 6px 2px 2px;
      background: var(--openui-pending-shape);
    }
    & .${n.hbars} {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
      min-height: 0;
    }
    & .${n.hbars} i {
      flex: 1 1 0;
      width: calc(var(--v) * 100%);
      min-height: 6px;
      max-height: 22px;
      border-radius: 2px 6px 6px 2px;
      background: var(--openui-pending-shape);
    }
    & .${n.ring} {
      display: grid;
      flex: 1;
      place-items: center;
      min-height: 0;
    }
    & .${n.ring} svg {
      width: 100%;
      height: 100%;
      max-width: 200px;
      max-height: 200px;
    }
    & .${n.ring} circle {
      fill: none;
      stroke: var(--openui-pending-shape);
      stroke-width: 14;
    }
    & .${n.rows} {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 14px;
      min-height: 0;
      overflow: hidden;
    }
  `,
  overlay: css`
    position: absolute;
    inset: 0;
    z-index: 5;
    display: grid;
    place-items: center;
    pointer-events: none;
  `,
  // The renderer's loading pill, over the cards.
  note: css`
    display: inline-flex;
    align-items: center;
    gap: var(--openui-space-2xs);
    padding: var(--openui-space-2xs) var(--openui-space-s);
    border: 1px solid var(--openui-border-default);
    border-radius: var(--openui-radius-full);
    background: var(--openui-background);
    box-shadow: var(--openui-shadow-s);
    color: var(--openui-text-neutral-secondary);
    /* The page's font family, a step below its root size, like an app's interface text. */
    font-size: 0.875rem;
    line-height: 1.2;
    white-space: nowrap;
  `,
  srOnly: css`
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  `,
};
