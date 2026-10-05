import type { ColorMode } from "./theme";

export type { ColorMode };

export type DevtoolsPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Public props for `<OpenUIDevtools />`. The thin package entry fetches the
 * CDN widget and forwards these into it (except `version`, which only
 * selects which package tag to load).
 */
export interface OpenUIDevtoolsProps {
  /** Force the widget on/off. Defaults to on outside production builds. */
  enabled?: boolean;
  /** Corner for the floating toggle button. Defaults to "bottom-right". */
  position?: DevtoolsPosition;
  /** How many events to keep; oldest are dropped first. */
  maxEvents?: number;
  /** Initial state of the drawer's "errors only" display filter: only
   *  error/warning events (default) or every event. */
  errorsOnly?: boolean;
  /** Initial state of the drawer's "auto-open on error" checkbox. Defaults to true. */
  autoOpenOnError?: boolean;
  /**
   * Widget UI theme. If passed, it wins over the stored Settings choice
   * and is written to config. Otherwise the stored theme is used, then light.
   * Never auto-detected from the host page or the OS.
   */
  theme?: ColorMode;
  /**
   * CDN package version to fetch. Omit for `@latest`.
   * Must be a major (`"0"`), minor (`"0.1"`), or exact (`"0.1.0"`) pin —
   * other strings are rejected and the widget does not mount.
   * react-lang's auto-mount passes `"0"` so the protocol major stays pinned.
   */
  version?: string;
  /**
   * @internal Set by react-lang's auto-mount. Auto-mounted instances yield to
   * any manually rendered <OpenUIDevtools /> so host-provided props win.
   */
  __autoMounted?: boolean;
}

/** Props the CDN widget itself understands (everything except the CDN tag). */
export type OpenUIDevtoolsWidgetProps = Omit<OpenUIDevtoolsProps, "version">;
