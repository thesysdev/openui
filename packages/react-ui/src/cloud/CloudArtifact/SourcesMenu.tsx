"use client";

import { autoUpdate, offset, shift, useFloating } from "@floating-ui/react-dom";
import type { DataSources } from "@openuidev/react-lang";
import clsx from "clsx";
import { ArrowLeft, ChevronRight, Layers, X } from "lucide-react";
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type TransitionEvent,
} from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../components/ThemeProvider";
import { SourceDetail, sourceEntry, SourceList } from "../SourcesContents/ComponentSources";
import { componentLabel, type Describe } from "../SourcesContents/describe";
import { sourceIndex } from "../SourcesContents/sourceIndex";
import { partClass as cx } from "../SourcesContents/sourcesDialog.styles";
import { names } from "./cloudArtifact.styles";
import {
  ChromeOverridesContext,
  MENU,
  ProvenanceContext,
  useArtifactProvenance,
  useArtifactRenderer,
  type MenuState,
} from "./contexts";
import { focusBack } from "./focus";
import { menuNames, menuStyles } from "./sourcesMenu.styles";
import { SHEET_EXIT_MS, SheetClose, SheetFrame, usePhone } from "./SourcesSheet";

/** Longer than its 150ms exit, in case `animationend` never comes. */
const EXIT_MS = 200;

/** What can take focus inside the menu, for its focus trap. */
const TABBABLE =
  "button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])";

const CSS_ESCAPE = (value: string) =>
  typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replace(/["\\]/g, "\\$&");

const items = (count: number) => `${count} ${count === 1 ? "item" : "items"}`;

/** Where the menu opens: under the split button its opener is in, else under the opener. */
function anchorFor(opener: Element | null): Element | null {
  if (!opener?.isConnected) return null;
  return opener.closest(`.${names.sourcesSplit}`) ?? opener;
}

/**
 * The All sources menu: every query and formula the dashboard's data-bound components read, each
 * with how many items use it. A source opens its detail, whose Used by links open an item's
 * popover on it. A modal dialog under the split button; it stays mounted through its exit,
 * `data-state="closed"`, so its motion can play.
 */
export function SourcesMenu({
  describeSource,
  custom,
  onCustomHost,
}: {
  describeSource?: Describe;
  /** The app's own contents replace the list and detail: they go in this host. */
  custom: boolean;
  onCustomHost: (host: HTMLElement | null) => void;
}) {
  const { menu, setMenuSource, closeMenu, openUsedBy, renderedIds } =
    useContext(ProvenanceContext)!.internal;
  const { sources } = useArtifactProvenance();
  // Named after the dashboard, as its bar names it.
  const barTitle = useContext(ChromeOverridesContext).title;
  const renderer = useArtifactRenderer();
  const title = barTitle ?? renderer.title;
  const open = menu !== null;
  // Below 640px it opens as a bottom sheet.
  const phone = usePhone();

  // Mounted while open, and through the exit, showing what it showed last.
  const [shown, setShown] = useState<MenuState | null>(null);
  if (open && shown !== menu) setShown(menu);
  useEffect(() => {
    if (open || !shown) return;
    const timer = setTimeout(() => setShown(null), phone ? SHEET_EXIT_MS : EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, shown, phone]);

  // Focus goes back to what opened it, unless something else took it meanwhile (an item's
  // popover, from Used by).
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const opener = shown?.opener ?? null;
  useEffect(() => {
    if (open || !root) return;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !root.contains(focused)) return;
    focusBack(opener);
  }, [open, root, opener]);

  // A click outside closes it; one on what opened it is left to that, which closes it too.
  useEffect(() => {
    if (!open || !root) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (root.contains(target) || anchorFor(opener)?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [open, root, opener, closeMenu]);

  if (!shown || !sources) return null;
  return (
    <Menu
      shown={shown}
      open={open}
      phone={phone}
      sources={sources}
      title={title}
      describeSource={describeSource}
      custom={custom}
      onCustomHost={onCustomHost}
      onRoot={setRoot}
      onExited={() => setShown(null)}
      onOpenSource={setMenuSource}
      onClose={closeMenu}
      onUsedBy={openUsedBy}
      renderedIds={renderedIds}
    />
  );
}

function Menu({
  shown,
  open,
  phone,
  sources,
  title,
  describeSource,
  custom,
  onCustomHost,
  onRoot,
  onExited,
  onOpenSource,
  onClose,
  onUsedBy,
  renderedIds,
}: {
  shown: MenuState;
  open: boolean;
  /** In a bottom sheet, below 640px, instead of under the split button. */
  phone: boolean;
  sources: DataSources;
  title?: string;
  describeSource?: Describe;
  custom: boolean;
  onCustomHost: (host: HTMLElement | null) => void;
  onRoot: (root: HTMLElement | null) => void;
  onExited: () => void;
  onOpenSource: (name: string | null) => void;
  onClose: () => void;
  onUsedBy: (id: string, source: string) => void;
  renderedIds: () => ReadonlySet<string>;
}) {
  const { portalThemeClassName } = useTheme();
  const anchor = anchorFor(shown.opener);
  const { refs, floatingStyles } = useFloating({
    strategy: "fixed",
    placement: "bottom-end",
    transform: false,
    open,
    elements: { reference: anchor },
    middleware: [offset(6), shift({ padding: 8, crossAxis: true })],
    whileElementsMounted: autoUpdate,
  });

  const { entries, usedBy } = useMemo(() => {
    const rendered = renderedIds();
    const index = sourceIndex(sources, { renders: (id) => rendered.has(id) });
    const all = [...index.sources.values()];
    return {
      entries: all.map((each) => sourceEntry(each, sources, describeSource)),
      usedBy: new Map(all.map((each) => [each.name, each.usedBy])),
    };
  }, [sources, describeSource, renderedIds]);
  const entry =
    shown.source !== null ? entries.find((each) => each.name === shown.source) : undefined;
  const users = entry ? (usedBy.get(entry.name) ?? []) : [];
  const view = entry ? `source\u0000${entry.name}` : "list";

  // Back on the list, focus goes to the row it came from.
  const travel = useRef<{ view: string; from?: string }>({ view });
  if (travel.current.view !== view) {
    travel.current = {
      view,
      from: travel.current.view.startsWith("source") ? travel.current.view.slice(7) : undefined,
    };
  }

  // Focus moves in on open, and follows the view: a source's heading, or on the list, the row it
  // came from (else the first).
  const ref = useRef<HTMLDivElement | null>(null);
  // Opening focuses the frame itself, so no row shows a focus ring after a click; Tab reaches the
  // rows from there.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open) {
      wasOpen.current = false;
      return;
    }
    const element = ref.current;
    if (!element) return;
    if (!wasOpen.current) {
      wasOpen.current = true;
      element.focus({ preventScroll: true });
      return;
    }
    const from = travel.current.from;
    const focus =
      element.querySelector<HTMLElement>("[data-heading]") ??
      (from ? element.querySelector<HTMLElement>(`[data-source="${CSS_ESCAPE(from)}"]`) : null) ??
      element.querySelector<HTMLElement>("[data-source]") ??
      element.querySelector<HTMLElement>(TABBABLE) ??
      element;
    focus.focus({ preventScroll: true });
  }, [open, view]);

  // Focus stays inside: Tab and Shift+Tab wrap around its controls.
  const trap = (event: ReactKeyboardEvent) => {
    if (event.key !== "Tab" || !ref.current) return;
    const tabbable = [...ref.current.querySelectorAll<HTMLElement>(TABBABLE)];
    if (!tabbable.length) {
      event.preventDefault();
      return;
    }
    const first = tabbable[0]!;
    const last = tabbable[tabbable.length - 1]!;
    const at = document.activeElement;
    const inside = at instanceof HTMLElement && tabbable.includes(at);
    if (event.shiftKey && (at === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (at === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  };

  const usedByLinks = (
    <div className={cx("block")}>
      <h4 className={cx("block-label")}>Used by</h4>
      <ul className={cx("used-by")} aria-label="Used by">
        {users.map((id) => (
          <li key={id}>
            <button
              type="button"
              className={cx("used-by-chip")}
              onClick={() => entry && onUsedBy(id, entry.name)}
            >
              <span>{componentLabel(sources, id) ?? id}</span>
              <ChevronRight aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const attributes = {
    role: "dialog",
    "aria-modal": true,
    tabIndex: -1,
    "aria-label": `All sources for ${title ?? "this dashboard"}`,
    "aria-hidden": open ? undefined : true,
    inert: !open || undefined,
    [MENU]: "",
    "data-state": open ? "open" : "closed",
    onKeyDown: trap,
    onAnimationEnd: (event: AnimationEvent<HTMLDivElement>) => {
      if (!open && event.target === event.currentTarget) onExited();
    },
    onTransitionEnd: (event: TransitionEvent<HTMLDivElement>) => {
      if (!open && event.target === event.currentTarget) onExited();
    },
  };

  const contents = (
    <>
      <header className={clsx(menuStyles.header, menuNames.header)}>
        {entry ? (
          <button
            type="button"
            className={clsx(menuStyles.back, menuNames.back)}
            onClick={() => onOpenSource(null)}
          >
            <ArrowLeft aria-hidden />
            <span>Back to all sources</span>
          </button>
        ) : (
          <span className={clsx(menuStyles.label, menuNames.label)}>
            <Layers aria-hidden />
            <span>Sources</span>
          </span>
        )}
        <span className={clsx(menuStyles.meta, menuNames.meta)}>
          {entry
            ? `Used by ${users.length}`
            : `${entries.length} ${entries.length === 1 ? "source" : "sources"}`}
        </span>
        {phone ? (
          <SheetClose onClose={onClose} />
        ) : (
          <button
            type="button"
            className={clsx(menuStyles.close, menuNames.close)}
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <X aria-hidden />
          </button>
        )}
      </header>
      <hr className={clsx(menuStyles.divider, menuNames.divider)} />
      <div className={clsx(menuStyles.body, menuNames.body)}>
        {custom ? (
          <div ref={onCustomHost} className={clsx(menuStyles.custom, menuNames.custom)} />
        ) : (
          <div
            key={view}
            className={clsx(menuStyles.view, menuNames.view)}
            data-view={entry ? "source" : "list"}
          >
            {entry ? (
              <SourceDetail entry={entry} before={usedByLinks} />
            ) : entries.length ? (
              <SourceList
                entries={entries}
                onOpen={onOpenSource}
                count={(each) => items(usedBy.get(each.name)?.length ?? 0)}
              />
            ) : (
              <p>Nothing on this dashboard reads data yet.</p>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (phone) {
    return (
      <SheetFrame
        open={open}
        setRef={(element) => {
          ref.current = element;
          onRoot(element);
        }}
        themeClassName={portalThemeClassName}
        attributes={attributes}
        onDismiss={onClose}
      >
        {contents}
      </SheetFrame>
    );
  }
  return createPortal(
    <div
      ref={(element) => {
        refs.setFloating(element);
        ref.current = element;
        onRoot(element);
      }}
      {...attributes}
      className={clsx(
        menuStyles.root,
        !anchor && menuStyles.unanchored,
        menuNames.root,
        portalThemeClassName,
      )}
      style={anchor ? floatingStyles : undefined}
    >
      {contents}
    </div>,
    document.body,
  );
}
