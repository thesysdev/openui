import { css } from "../../../styles/css";

/** Stable override targets for FunnelChart. */
export const names = {
  root: "openui-funnel-chart",
  ring: "openui-funnel-chart-ring",
  orientation: {
    horizontal: "openui-funnel-chart--orientation-horizontal",
    vertical: "openui-funnel-chart--orientation-vertical",
  },
  stage: "openui-funnel-chart-stage",
  value: "openui-funnel-chart-value",
  label: "openui-funnel-chart-label",
  pct: "openui-funnel-chart-pct",
  pctPill: "openui-funnel-chart-pct-pill",
  stageIsAnimationActive: "openui-funnel-chart-stage--is-animation-active",
  readouts: "openui-funnel-chart-readouts",
  labels: "openui-funnel-chart-labels",
  svg: "openui-funnel-chart-svg",
  group: "openui-funnel-chart-group",
  textLine: "openui-funnel-chart-text-line",
  hitbox: "openui-funnel-chart-hitbox",
  edges: {
    curved: "openui-funnel-chart--edges-curved",
    straight: "openui-funnel-chart--edges-straight",
  },
  isAnimationActive: {
    true: "openui-funnel-chart--is-animation-active",
  },
} as const;

// Register entrance keyframes before the rules that reference them, on import.
css`
  @keyframes openui-funnel-chart-appear {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;
export const funnelChartStyles = {
  root: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
    width: var(--_openui-funnel-chart-root-width, 100%);
    height: var(--_openui-funnel-chart-root-height, unset);
  `,
  ring: css`
    transition:
      d 0.3s ease,
      fill-opacity 0.2s ease;
    transform-box: fill-box;
    transform-origin: center;
    transform: scaleX(
        calc(
          1 + (var(--_openui-funnel-chart-ring-scale, 1) - 1) *
            var(--_openui-funnel-chart-ring-x, 0)
        )
      )
      scaleY(
        calc(
          1 + (var(--_openui-funnel-chart-ring-scale, 1) - 1) *
            var(--_openui-funnel-chart-ring-y, 0)
        )
      );
    @media print {
      transition: none;
    }
  `,
  orientation: {
    horizontal: css`
      --_openui-funnel-chart-ring-x: 0;
      --_openui-funnel-chart-ring-y: 1;
    `,
    vertical: css`
      --_openui-funnel-chart-ring-x: 1;
      --_openui-funnel-chart-ring-y: 0;
    `,
  },
  stage: css`
    transition: filter 0.2s ease;
    @media print {
      transition: none;
    }
    animation-delay: var(--_openui-funnel-chart-stage-animation-delay, unset);
    filter: var(--_openui-funnel-chart-stage-filter, unset);
    pointer-events: var(--_openui-funnel-chart-stage-pointer-events, unset);
  `,
  value: css`
    font: var(--openui-text-label-sm, 400 14px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-sm-letter-spacing, -0.01em);
    font-variation-settings: normal;
    fill: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
    font-weight: 600;
  `,
  label: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    fill: var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6));
  `,
  pct: css`
    font: var(--openui-text-label-xs, 400 12px/1.25 "Inter", sans-serif);
    letter-spacing: var(--openui-text-label-xs-letter-spacing, -0.01em);
    font-variation-settings: var(--openui-font-variation-regular, "wght" 440);
    fill: var(--openui-background, oklch(0.97 0 89.876 / 1));
    font-weight: 700;
    font-variation-settings: normal;
  `,
  pctPill: css`
    fill: var(--openui-text-neutral-primary, oklch(0.097 0 0 / 1));
  `,
  stageIsAnimationActive: css`
    @media (prefers-reduced-motion: no-preference) {
      opacity: 0;
      transform-box: fill-box;
      transform-origin: center;
      animation: openui-funnel-chart-appear 0.5s ease-out forwards;
      animation-delay: var(--_openui-funnel-chart-stage-animation-delay, 0s);
    }
  `,
  svg: css`
    overflow: var(--_openui-funnel-chart-svg-overflow, unset);
  `,
  readouts: css`
    pointer-events: var(--_openui-funnel-chart-readouts-pointer-events, unset);
    opacity: var(--_openui-funnel-chart-readouts-opacity, unset);
  `,
  labels: css`
    pointer-events: var(--_openui-funnel-chart-labels-pointer-events, unset);
    opacity: var(--_openui-funnel-chart-labels-opacity, unset);
  `,
  hitbox: css`
    pointer-events: var(--_openui-funnel-chart-hitbox-pointer-events, unset);
    cursor: var(--_openui-funnel-chart-hitbox-cursor, unset);
  `,
};
