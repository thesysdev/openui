"use client";

import { observability, type ObservabilityEvent } from "@openuidev/observability";
import { Inbox, RotateCcw, Settings, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { DEFAULT_EDITOR_PCT, useDebug } from "./debug";
import {
  EventRow,
  getQuotaError,
  getReactLangStreamDetail,
  QuotaErrorRow,
  ReactLangStreamEventRow,
} from "./inspect";
import {
  addOrReplaceEvent,
  isLibraryEvent,
  useDevtoolsConfig,
  useDevtoolsSingleton,
  type DevtoolsConfig,
} from "./lib";
import {
  DEFAULT_COLOR_MODE,
  DevtoolsModeProvider,
  FONT,
  rootStyle,
  theme,
  useStyles,
  type ThemeTokens,
} from "./theme";
import type { DevtoolsPosition, OpenUIDevtoolsWidgetProps } from "./types";
import { ErrorBoundary, IconButton, INTER_FONT_FACE, ShiroLogo, ThemeSegmented } from "./ui";
import { DeployBanner, DeployHint } from "./ui/DeployHint";
import ReliabilityBanner from "./ui/ReliabilityBanner";

export type { DevtoolsPosition, OpenUIDevtoolsProps, OpenUIDevtoolsWidgetProps } from "./types";

/** Uniform row height for the settings menu, set by its tallest control. */
const MENU_ROW_HEIGHT = 28;

/**
 * Tray geometry. The two trays together fill a block anchored to the bottom
 * right — 85% of the viewport, capped so it stops growing on very large
 * displays. Inspect keeps a fixed width and Debug takes whatever is left,
 * overlapping Inspect rather than collapsing once it hits its floor.
 */
const TRAY_EDGE = 12;
const TRAY_GAP = 12;
const INSPECT_WIDTH = 480;
const DEBUG_MIN_WIDTH = 360;
const BLOCK_W = `min(85vw, 3456px)`;
const BLOCK_H = `min(85vh, 2234px)`;

/**
 * Full Inspect/Debug UI. Only loaded from the CDN browser bundle after the
 * host has injected React into the slot — not from the npm package entry.
 */
export function OpenUIDevtoolsWidget({
  enabled,
  position = "bottom-right",
  maxEvents = 50,
  errorsOnly = false,
  autoOpenOnError = true,
  theme: themeProp,
  __autoMounted = false,
}: OpenUIDevtoolsWidgetProps) {
  const isEnabled =
    enabled ?? (typeof process === "undefined" || process.env["NODE_ENV"] !== "production");
  // Only one instance renders even when several are mounted (e.g. react-lang's
  // auto-mount plus a manual <OpenUIDevtools /> in the host's layout).
  const isSingleton = useDevtoolsSingleton(__autoMounted);
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [toggleHovered, setToggleHovered] = useState(false);
  const { config, setConfig, configRef } = useDevtoolsConfig(
    {
      autoOpen: autoOpenOnError,
      onlyErrors: errorsOnly,
      theme: DEFAULT_COLOR_MODE,
      helpSeen: false,
      editorPct: DEFAULT_EDITOR_PCT,
    },
    { theme: themeProp },
  );
  const { onlyErrors, theme: mode } = config;
  const debug = useDebug({
    theme: mode,
    helpSeen: config.helpSeen,
    editorPct: config.editorPct,
    setConfig,
  });
  const styles = uiStyles(theme(mode));

  // Read configRef inside the (stable) subscription without re-subscribing.
  useEffect(() => {
    if (!isEnabled) return;
    return observability.listenAll((event) => {
      if (isLibraryEvent(event)) return;
      setEvents((prev) => addOrReplaceEvent(prev, event, maxEvents));
      if (event.level === "error" && configRef.current.autoOpen) setOpen(true);
    });
  }, [isEnabled, maxEvents, configRef]);

  // Escape dismisses the top tray first: Debug → Inspect → closed. The
  // settings menu handles its own Escape first (capture phase), so it never
  // falls through to here.
  useEffect(() => {
    if (!open && !debug.trayOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (debug.trayOpen) debug.retract();
      else setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, debug.trayOpen, debug.retract]);

  if (!isEnabled || !isSingleton) return null;

  const errorCount = events.filter((event) => event.level === "error").length;
  const visibleEvents = onlyErrors ? events.filter((event) => event.level !== "info") : events;

  // Inspect is pinned to the right edge; Debug fills the rest of the block and
  // slides over to reclaim Inspect's slot whenever Inspect is out.
  const inspectSlot = open ? INSPECT_WIDTH + TRAY_GAP : 0;
  const inspectTray: CSSProperties = {
    right: TRAY_EDGE,
    bottom: TRAY_EDGE,
    height: BLOCK_H,
    width: `min(${INSPECT_WIDTH}px, calc(100vw - ${TRAY_EDGE * 2}px))`,
    transform: open ? "translateX(0)" : `translateX(calc(100% + ${TRAY_EDGE}px))`,
  };
  // Debug is a workspace rather than a peek at the app behind it: it fills
  // everything Inspect leaves (left/right edges rather than a width, so the
  // inset matches top and bottom) and cuts straight in instead of sliding.
  // Overrides the shared UI, so it is spread last.
  const debugTray: CSSProperties = {
    right: TRAY_EDGE + inspectSlot,
    bottom: TRAY_EDGE,
    height: BLOCK_H,
    width: `max(${DEBUG_MIN_WIDTH}px, calc(${BLOCK_W} - ${inspectSlot}px))`,
    transform: "none",
    transition: "none",
    visibility: debug.trayOpen ? "visible" : "hidden",
  };

  return (
    <DevtoolsModeProvider mode={mode}>
      <style>{INTER_FONT_FACE}</style>
      <DeployHint position={position} hidden={open || debug.trayOpen} />
      <div style={{ ...styles.toggleWrap, ...rootStyle(mode), ...positionStyles[position] }}>
        <button
          style={{
            ...styles.toggle,
            ...(errorCount > 0 ? styles.toggleError : null),
            ...(toggleHovered ? styles.toggleHover : null),
          }}
          onClick={() => setOpen(true)}
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
          aria-label="Open OpenUI Inspect"
          aria-expanded={open}
          title={
            errorCount > 0 ? `${errorCount} error${errorCount === 1 ? "" : "s"}` : "OpenUI Inspect"
          }
        >
          {errorCount > 0 ? (
            <span style={styles.toggleCount}>{errorCount > 99 ? "99+" : errorCount}</span>
          ) : (
            <ShiroLogo size={22} />
          )}
        </button>
      </div>

      {/* Kept mounted so open/close can transition; hidden + inert when closed. */}
      <aside
        style={{
          ...styles.drawer,
          ...rootStyle(mode),
          ...inspectTray,
          ...(open ? styles.drawerOpen : null),
        }}
        role="dialog"
        aria-modal={false}
        aria-label="OpenUI Inspect"
        inert={!open}
      >
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.title}>OpenUI Inspect</span>
          </div>
          <div style={styles.headerActions}>
            <IconButton
              onClick={() => setEvents([])}
              aria-label="Reset events"
              title="Reset events"
            >
              <RotateCcw size={14} />
            </IconButton>
            <SettingsMenu config={config} onChange={setConfig} />
            <IconButton onClick={() => setOpen(false)} aria-label="Close OpenUI Inspect">
              <X size={15} />
            </IconButton>
          </div>
        </div>

        <ReliabilityBanner themeMode={mode} />

        <ErrorBoundary title="Inspect ran into a problem">
          <div style={styles.list}>
            <DeployBanner />
            {visibleEvents.length === 0 ? (
              <div style={styles.empty}>
                <span style={styles.emptyIcon}>
                  <Inbox size={20} />
                </span>
                No events captured yet.
              </div>
            ) : (
              visibleEvents.map((event, index) => {
                const key =
                  typeof event.detail["id"] === "string"
                    ? event.detail["id"]
                    : `${event.timestamp}-${index}`;
                const quotaError = getQuotaError(event);
                if (quotaError) return <QuotaErrorRow key={key} info={quotaError} />;
                const stream = getReactLangStreamDetail(event);
                if (stream) {
                  return (
                    <ReactLangStreamEventRow
                      key={key}
                      event={event}
                      stream={stream}
                      canOpenInDebug={debug.canOpen}
                      onOpenInDebug={debug.openWith}
                    />
                  );
                }
                return <EventRow key={key} event={event} />;
              })
            )}
          </div>
        </ErrorBoundary>
        <span style={styles.trayFade} aria-hidden />
      </aside>

      <aside
        style={{
          ...styles.drawer,
          ...rootStyle(mode),
          ...(debug.trayOpen ? styles.drawerOpen : null),
          ...debugTray,
        }}
        role="dialog"
        aria-modal={false}
        aria-label="OpenUI Debug"
        inert={!debug.trayOpen}
      >
        <div style={styles.debugHost}>{debug.view}</div>
      </aside>
      {debug.portal}
    </DevtoolsModeProvider>
  );
}

/**
 * A real checkbox painted as a switch — the input stays in the tree (hidden but
 * clickable and focusable) so keyboard, form semantics, and screen readers get
 * the native control rather than a div pretending to be one.
 */
function SettingSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const styles = useStyles(uiStyles);
  return (
    <label style={styles.menuCheckbox}>
      <span style={styles.menuLabel}>{label}</span>
      <span style={{ ...styles.switchTrack, ...(checked ? styles.switchTrackOn : null) }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          style={styles.switchInput}
        />
        <span style={{ ...styles.switchKnob, ...(checked ? styles.switchKnobOn : null) }} />
      </span>
    </label>
  );
}

/**
 * Header dropdown for the display filters and the widget theme, so the list is
 * all list. Escape is handled in the capture phase so closing the menu doesn't
 * also step the drawer back.
 */
function SettingsMenu({
  config,
  onChange,
}: {
  config: DevtoolsConfig;
  onChange: (patch: Partial<DevtoolsConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  const styles = useStyles(uiStyles);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={wrap} style={styles.menuWrap}>
      <IconButton
        active={open}
        onClick={() => setOpen((current) => !current)}
        aria-label="Devtools settings"
        aria-haspopup="true"
        aria-expanded={open}
        title="Settings"
      >
        <Settings size={14} />
      </IconButton>
      {open ? (
        <div style={styles.menu} role="group" aria-label="Devtools settings">
          {/* Every row reads the same way: name on the left, control on the
              right, hairline between. */}
          <SettingSwitch
            label="Auto-open on error"
            checked={config.autoOpen}
            onChange={(autoOpen) => onChange({ autoOpen })}
          />
          <div style={styles.menuDivider} />
          <SettingSwitch
            label="Show errors only"
            checked={config.onlyErrors}
            onChange={(onlyErrors) => onChange({ onlyErrors })}
          />
          <div style={styles.menuDivider} />
          <div style={styles.menuRow}>
            <span style={styles.menuLabel}>Theme</span>
            <ThemeSegmented value={config.theme} onChange={(theme) => onChange({ theme })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const positionStyles: Record<DevtoolsPosition, CSSProperties> = {
  "top-left": { top: 16, left: 16 },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "bottom-right": { bottom: 16, right: 16 },
};

function uiStyles(t: ThemeTokens) {
  return {
    toggleWrap: {
      position: "fixed",
      // Max 32-bit signed int — sit above any app UI.
      zIndex: 2147483647,
    },
    toggle: {
      boxSizing: "border-box",
      width: 40,
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: t.toggleBorder,
      background: t.toggleBg,
      color: t.toggleFg,
      cursor: "pointer",
      boxShadow: t.toggleShadow,
      fontFamily: FONT,
      padding: 0,
      transition: "background 150ms ease, box-shadow 150ms ease, transform 150ms ease",
    },
    toggleHover: {
      transform: "scale(1.08)",
    },
    // Errors swap the mark for a count on a red disc, held inside a light puck so
    // the number reads as a badge rather than flooding the whole button red.
    toggleError: {
      background: t.toggleErrorSurface,
      borderColor: t.toggleErrorRing,
    },
    toggleCount: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      minWidth: 24,
      height: 24,
      padding: "0 6px",
      borderRadius: 999,
      background: t.toggleError,
      color: "#fff",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1,
    },
    // Geometry (right/width/transform) is per-tray and set inline; this is the
    // shared UI. Each tray hides itself when closed so the other can stay open
    // without a retracted tray remaining focusable.
    drawer: {
      position: "fixed",
      // Max 32-bit signed int — sit above any app UI, including the toggle.
      zIndex: 2147483647,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: t.trayRing,
      borderRadius: 16,
      background: t.bg,
      boxShadow: t.trayShadow,
      color: t.fg,
      fontFamily: FONT,
      fontSize: 13,
      visibility: "hidden",
      transition:
        "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), right 260ms cubic-bezier(0.32, 0.72, 0, 1), width 260ms cubic-bezier(0.32, 0.72, 0, 1), visibility 0s linear 220ms",
      overflow: "hidden",
    },
    drawerOpen: {
      visibility: "visible",
      transition:
        "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), right 260ms cubic-bezier(0.32, 0.72, 0, 1), width 260ms cubic-bezier(0.32, 0.72, 0, 1), visibility 0s",
    },
    debugHost: {
      flex: 1,
      minHeight: 0,
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      padding: "12px 16px",
      fontWeight: 600,
      fontSize: 14,
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    title: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    headerActions: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexShrink: 0,
    },
    menuWrap: {
      position: "relative",
      display: "inline-flex",
    },
    menu: {
      position: "absolute",
      top: "calc(100% + 6px)",
      right: 0,
      // Above the banner group.
      zIndex: 2,
      boxSizing: "border-box",
      width: 236,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      background: t.bg,
      boxShadow: t.shadow,
      padding: 12,
      fontWeight: 400,
    },
    // Every row is the height of the tallest control (the theme toggle), so the
    // dividers land on an even rhythm no matter what each row holds.
    menuCheckbox: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: MENU_ROW_HEIGHT,
      cursor: "pointer",
    },
    switchTrack: {
      position: "relative",
      boxSizing: "border-box",
      flexShrink: 0,
      width: 30,
      height: 18,
      borderRadius: 999,
      background: t.border,
      transition: "background 150ms ease",
    },
    switchTrackOn: {
      background: t.inverted,
    },
    // Covers the whole track so the hit area and focus ring stay on the input.
    switchInput: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      margin: 0,
      borderRadius: 999,
      opacity: 0,
      cursor: "pointer",
    },
    switchKnob: {
      position: "absolute",
      top: 2,
      left: 2,
      width: 14,
      height: 14,
      borderRadius: "50%",
      background: t.bg,
      boxShadow: t.shadowSubtle,
      transition: "transform 150ms ease",
      pointerEvents: "none",
    },
    switchKnobOn: {
      transform: "translateX(12px)",
    },
    menuDivider: {
      height: 1,
      background: t.borderSubtle,
    },
    menuRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      minHeight: MENU_ROW_HEIGHT,
    },
    menuLabel: {
      fontSize: 12,
      fontWeight: 500,
      color: t.fg,
    },
    // Fades rows at the tray's bottom edge, so they dissolve into the
    // drawer instead of meeting the border mid-row. Pinned to the tray rather
    // than the list, so it covers the stack-trace view too.
    trayFade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 28,
      background: `linear-gradient(to top, ${t.bg}, transparent)`,
      pointerEvents: "none",
    },
    list: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "0 12px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    // Fills the list so the message sits in the middle of the tray, not pinned
    // under the header.
    empty: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      color: t.fgFaint,
      textAlign: "center",
    },
    emptyIcon: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    },
  } satisfies Record<string, CSSProperties>;
}
