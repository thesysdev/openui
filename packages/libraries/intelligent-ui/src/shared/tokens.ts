/**
 * The kit's design tokens as they are written in its styles. Each reads a
 * react-components token, so the kit follows ThemeProvider: its mode, its
 * lightTheme and darkTheme, wherever it writes them. Nothing sets the
 * --openui-intelligent-* variables by default; an app sets one to override that
 * token alone. Mixes resolve where they are used, so they follow the theme there.
 * The last fallback in each is react-components' light default, for a response
 * that renders with no theme at all.
 */
export const tokens = {
  font: 'var(--openui-intelligent-font, var(--openui-font-body, "Inter", sans-serif))',
  mono: "var(--openui-intelligent-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",
  canvas: "var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876)))",
  hover:
    "var(--openui-intelligent-hover, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 5%, transparent))",
  pressed:
    "var(--openui-intelligent-pressed, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 8%, transparent))",
  surface:
    "var(--openui-intelligent-surface, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 4%, transparent))",
  surfaceStrong:
    "var(--openui-intelligent-surface-strong, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 8%, transparent))",
  ink: "var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0)))",
  inkHover:
    "var(--openui-intelligent-ink-hover, color-mix(in oklch, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 82%, var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876)))))",
  onInk: "var(--openui-intelligent-on-ink, var(--openui-foreground, oklch(0.994 0 89.876)))",
  muted:
    "var(--openui-intelligent-muted, var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6)))",
  faint:
    "var(--openui-intelligent-faint, var(--openui-text-neutral-secondary, oklch(0.097 0 0 / 0.6)))",
  border:
    "var(--openui-intelligent-border, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 8%, transparent))",
  borderStrong:
    "var(--openui-intelligent-border-strong, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 10%, transparent))",
  rangeTrack:
    "var(--openui-intelligent-range-track, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 6%, transparent))",
  rangeThumb:
    "var(--openui-intelligent-range-thumb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))))",
  focus:
    "var(--openui-intelligent-focus, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))))",
  glass:
    "var(--openui-intelligent-glass, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876))) 70%, transparent))",
  glassHover:
    "var(--openui-intelligent-glass-hover, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876))) 85%, transparent))",
  glassRing:
    "var(--openui-intelligent-glass-ring, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876))) 70%, transparent))",
  glassRingHover:
    "var(--openui-intelligent-glass-ring-hover, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876))) 85%, transparent))",
  shadow:
    "var(--openui-intelligent-shadow, var(--openui-shadow-l, 0 4px 4px -2px oklch(0 0 0 / 0.05), 0 4px 8px -2px oklch(0 0 0 / 0.04)))",
  shadowSm:
    "var(--openui-intelligent-shadow-sm, var(--openui-shadow-s, 0 1px 3px -2px oklch(0 0 0 / 0.02), 0 2px 5px -2px oklch(0 0 0 / 0.04)))",
  info: "var(--openui-intelligent-info, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))))",
  infoSoft:
    "var(--openui-intelligent-info-soft, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 6%, transparent))",
  success:
    "var(--openui-intelligent-success, var(--openui-text-success-primary, oklch(0.448 0.108 151.328)))",
  successSoft:
    "var(--openui-intelligent-success-soft, var(--openui-success-background, oklch(0.627 0.17 149.214 / 0.12)))",
  warning:
    "var(--openui-intelligent-warning, var(--openui-text-alert-primary, oklch(0.476 0.103 61.907)))",
  warningSoft:
    "var(--openui-intelligent-warning-soft, var(--openui-alert-background, oklch(0.795 0.162 86.047 / 0.16)))",
  danger:
    "var(--openui-intelligent-danger, var(--openui-text-danger-primary, oklch(0.505 0.19 27.518)))",
  dangerSoft:
    "var(--openui-intelligent-danger-soft, var(--openui-danger-background, oklch(0.577 0.215 27.325 / 0.12)))",
  purple:
    "var(--openui-intelligent-purple, var(--openui-text-purple-primary, oklch(0.438 0.198 303.724)))",
  purpleSoft:
    "var(--openui-intelligent-purple-soft, var(--openui-purple-background, oklch(0.627 0.233 303.9 / 0.12)))",
  pink: "var(--openui-intelligent-pink, var(--openui-text-pink-primary, oklch(0.459 0.17 3.815)))",
  pinkSoft:
    "var(--openui-intelligent-pink-soft, var(--openui-pink-background, oklch(0.592 0.218 0.584 / 0.12)))",
  badgeNeutralSoft:
    "var(--openui-intelligent-badge-neutral-soft, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 6%, transparent))",
  badgeSuccess:
    "var(--openui-intelligent-badge-success, var(--openui-text-success-primary, oklch(0.448 0.108 151.328)))",
  badgeSuccessSoft:
    "var(--openui-intelligent-badge-success-soft, var(--openui-success-background, oklch(0.627 0.17 149.214 / 0.12)))",
  badgeWarning:
    "var(--openui-intelligent-badge-warning, var(--openui-text-alert-primary, oklch(0.476 0.103 61.907)))",
  badgeWarningSoft:
    "var(--openui-intelligent-badge-warning-soft, var(--openui-alert-background, oklch(0.795 0.162 86.047 / 0.16)))",
  badgeDanger:
    "var(--openui-intelligent-badge-danger, var(--openui-text-danger-primary, oklch(0.505 0.19 27.518)))",
  badgeDangerSoft:
    "var(--openui-intelligent-badge-danger-soft, var(--openui-danger-background, oklch(0.577 0.215 27.325 / 0.12)))",
  badgePurple:
    "var(--openui-intelligent-badge-purple, var(--openui-text-purple-primary, oklch(0.438 0.198 303.724)))",
  badgePurpleSoft:
    "var(--openui-intelligent-badge-purple-soft, var(--openui-purple-background, oklch(0.627 0.233 303.9 / 0.12)))",
  badgePink:
    "var(--openui-intelligent-badge-pink, var(--openui-text-pink-primary, oklch(0.459 0.17 3.815)))",
  badgePinkSoft:
    "var(--openui-intelligent-badge-pink-soft, var(--openui-pink-background, oklch(0.592 0.218 0.584 / 0.12)))",
  chart1: "var(--openui-intelligent-chart-1, #0285ff)",
  chart2: "var(--openui-intelligent-chart-2, #00a67d)",
  chart3: "var(--openui-intelligent-chart-3, #8b5cf6)",
  chart4: "var(--openui-intelligent-chart-4, #f4a340)",
  chart5: "var(--openui-intelligent-chart-5, #e46d91)",
  chart6: "var(--openui-intelligent-chart-6, #4b9ca6)",
  mapWater:
    "var(--openui-intelligent-map-water, color-mix(in oklab, #4fb3d9 45%, var(--openui-intelligent-canvas, var(--openui-foreground, oklch(0.994 0 89.876)))))",
  spaceTight: "var(--openui-intelligent-space-tight, 4px)",
  spaceInner: "var(--openui-intelligent-space-inner, 8px)",
  spaceGroup: "var(--openui-intelligent-space-group, 12px)",
  spaceGroupLg: "var(--openui-intelligent-space-group-lg, 16px)",
  spaceSection: "var(--openui-intelligent-space-section, 24px)",
  controlGap: "var(--openui-intelligent-control-gap, 8px)",
  fieldGap: "var(--openui-intelligent-field-gap, 24px)",
  actionGap: "var(--openui-intelligent-action-gap, 40px)",
  radiusSm: "var(--openui-intelligent-radius-sm, 6px)",
  radiusMd: "var(--openui-intelligent-radius-md, 10px)",
  radiusLg: "var(--openui-intelligent-radius-lg, 12px)",
  radiusXl: "var(--openui-intelligent-radius-xl, 14px)",
  radius2xl: "var(--openui-intelligent-radius-2xl, 20px)",
  photoEmpty:
    "var(--openui-intelligent-photo-empty, var(--openui-intelligent-surface, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 4%, transparent)))",
  photoEmptyIcon:
    "var(--openui-intelligent-photo-empty-icon, var(--openui-intelligent-border-strong, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, oklch(0.097 0 0))) 10%, transparent)))",
} as const;
