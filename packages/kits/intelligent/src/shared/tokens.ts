/**
 * The kit's design tokens as they are written in its styles. Each reads a
 * react-components token, so the kit follows ThemeProvider: its mode, its
 * lightTheme and darkTheme, wherever it writes them. Nothing sets the
 * --openui-intelligent-* variables by default; an app sets one to override that
 * token alone. Mixes resolve where they are used, so they follow the theme there.
 */
export const tokens = {
  font: 'var(--openui-intelligent-font, var(--openui-font-body, "Inter", sans-serif))',
  mono: "var(--openui-intelligent-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)",
  canvas: "var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff))",
  hover:
    "var(--openui-intelligent-hover, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 5%, transparent))",
  pressed:
    "var(--openui-intelligent-pressed, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 8%, transparent))",
  surface:
    "var(--openui-intelligent-surface, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 4%, transparent))",
  surfaceHover:
    "var(--openui-intelligent-surface-hover, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 8%, transparent))",
  surfaceStrong:
    "var(--openui-intelligent-surface-strong, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 8%, transparent))",
  ink: "var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d))",
  inkHover:
    "var(--openui-intelligent-ink-hover, color-mix(in oklch, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 82%, var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff))))",
  onInk: "var(--openui-intelligent-on-ink, var(--openui-foreground, #ffffff))",
  muted: "var(--openui-intelligent-muted, var(--openui-text-neutral-secondary, rgb(0 0 0 / 60%)))",
  faint: "var(--openui-intelligent-faint, var(--openui-text-neutral-secondary, rgb(0 0 0 / 60%)))",
  border:
    "var(--openui-intelligent-border, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 8%, transparent))",
  borderStrong:
    "var(--openui-intelligent-border-strong, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 10%, transparent))",
  rangeTrack:
    "var(--openui-intelligent-range-track, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 6%, transparent))",
  rangeThumb:
    "var(--openui-intelligent-range-thumb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)))",
  focus:
    "var(--openui-intelligent-focus, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)))",
  glass:
    "var(--openui-intelligent-glass, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff)) 70%, transparent))",
  glassHover:
    "var(--openui-intelligent-glass-hover, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff)) 85%, transparent))",
  glassRing:
    "var(--openui-intelligent-glass-ring, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff)) 70%, transparent))",
  glassRingHover:
    "var(--openui-intelligent-glass-ring-hover, color-mix(in srgb, var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff)) 85%, transparent))",
  shadow: "var(--openui-intelligent-shadow, var(--openui-shadow-l, 0 4px 20px rgb(0 0 0 / 6%)))",
  shadowSm:
    "var(--openui-intelligent-shadow-sm, var(--openui-shadow-s, 0 1px 3px rgb(0 0 0 / 5%)))",
  info: "var(--openui-intelligent-info, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)))",
  infoSoft:
    "var(--openui-intelligent-info-soft, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 6%, transparent))",
  success: "var(--openui-intelligent-success, var(--openui-text-success-primary, #00805d))",
  successSoft: "var(--openui-intelligent-success-soft, var(--openui-success-background, #edf9f2))",
  warning: "var(--openui-intelligent-warning, var(--openui-text-alert-primary, #8a5300))",
  warningSoft: "var(--openui-intelligent-warning-soft, var(--openui-alert-background, #ffefc7))",
  danger: "var(--openui-intelligent-danger, var(--openui-text-danger-primary, #c1322c))",
  dangerSoft: "var(--openui-intelligent-danger-soft, var(--openui-danger-background, #fff0ee))",
  purple: "var(--openui-intelligent-purple, var(--openui-text-purple-primary, #7040c1))",
  purpleSoft: "var(--openui-intelligent-purple-soft, var(--openui-purple-background, #f4f0ff))",
  pink: "var(--openui-intelligent-pink, var(--openui-text-pink-primary, #b7377c))",
  pinkSoft: "var(--openui-intelligent-pink-soft, var(--openui-pink-background, #fff0f6))",
  badgeNeutralSoft:
    "var(--openui-intelligent-badge-neutral-soft, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 6%, transparent))",
  badgeSuccess:
    "var(--openui-intelligent-badge-success, var(--openui-text-success-primary, #1f6b4f))",
  badgeSuccessSoft:
    "var(--openui-intelligent-badge-success-soft, var(--openui-success-background, #e8f3ec))",
  badgeWarning:
    "var(--openui-intelligent-badge-warning, var(--openui-text-alert-primary, #8a5300))",
  badgeWarningSoft:
    "var(--openui-intelligent-badge-warning-soft, var(--openui-alert-background, #ffefc7))",
  badgeDanger: "var(--openui-intelligent-badge-danger, var(--openui-text-danger-primary, #9f3a33))",
  badgeDangerSoft:
    "var(--openui-intelligent-badge-danger-soft, var(--openui-danger-background, #f8e8e5))",
  badgePurple: "var(--openui-intelligent-badge-purple, var(--openui-text-purple-primary, #5d4596))",
  badgePurpleSoft:
    "var(--openui-intelligent-badge-purple-soft, var(--openui-purple-background, #efebf7))",
  badgePink: "var(--openui-intelligent-badge-pink, var(--openui-text-pink-primary, #94456d))",
  badgePinkSoft:
    "var(--openui-intelligent-badge-pink-soft, var(--openui-pink-background, #f7eaf1))",
  chart1: "var(--openui-intelligent-chart-1, #0285ff)",
  chart2: "var(--openui-intelligent-chart-2, #00a67d)",
  chart3: "var(--openui-intelligent-chart-3, #8b5cf6)",
  chart4: "var(--openui-intelligent-chart-4, #f4a340)",
  chart5: "var(--openui-intelligent-chart-5, #e46d91)",
  chart6: "var(--openui-intelligent-chart-6, #4b9ca6)",
  mapWater:
    "var(--openui-intelligent-map-water, color-mix(in oklab, #4fb3d9 45%, var(--openui-intelligent-canvas, var(--openui-foreground, #ffffff))))",
  ring: "var(--openui-intelligent-ring, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)))",
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
    "var(--openui-intelligent-photo-empty, var(--openui-intelligent-surface, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 4%, transparent)))",
  photoEmptyIcon:
    "var(--openui-intelligent-photo-empty-icon, var(--openui-intelligent-border-strong, color-mix(in srgb, var(--openui-intelligent-ink, var(--openui-text-neutral-primary, #0d0d0d)) 10%, transparent)))",
} as const;
