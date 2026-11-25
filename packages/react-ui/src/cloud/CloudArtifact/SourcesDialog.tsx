"use client";

import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { ArrowLeft, X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTheme } from "../../components/ThemeProvider";
import { DataSourcesContents, sourcesTitle } from "../DataSourcesPanel";
import { dialogNames, dialogStyles } from "../DataSourcesPanel/dataSourcesPanel.styles";
import type { DataSourcesPanelProps } from "../DataSourcesPanel/types";
import { ProvenanceContext, useArtifactProvenance } from "./contexts";
import { SourcesHoverCard } from "./SourcesHoverCard";

/** What an app can tell the default Sources contents, through the `Provenance` slot's props. */
export type SourcesOptions = Pick<DataSourcesPanelProps, "describeSource">;

interface SourcesState {
  options: SourcesOptions;
  setOptions: (options: SourcesOptions) => void;
  /** An app passed its own contents to `Provenance`: the default ones step aside. */
  custom: number;
  setCustom: (update: (count: number) => number) => void;
  /** Where the app's own contents go, inside the open dialog. */
  customHost: HTMLElement | null;
}

export const SourcesContext = createContext<SourcesState | null>(null);

const NO_OPTIONS: SourcesOptions = {};
/** Longer than any exit (the phone sheet's 300ms), in case `transitionend` never comes. */
const EXIT_MS = 350;

/** The artifact's content, and with provenance on, the Sources dialog that opens over it. */
export function SourcesProvider({ children }: { children: ReactNode }) {
  const provenance = useContext(ProvenanceContext);
  const [options, setOptions] = useState<SourcesOptions>(NO_OPTIONS);
  const [custom, setCustom] = useState(0);
  const [customHost, setCustomHost] = useState<HTMLElement | null>(null);
  const state = useMemo<SourcesState>(
    () => ({ options, setOptions, custom, setCustom, customHost }),
    [options, custom, customHost],
  );

  if (!provenance) return <>{children}</>;
  return (
    <SourcesContext.Provider value={state}>
      {children}
      <SourcesDialog onCustomHost={setCustomHost} />
      <SourcesHoverCard describeSource={options.describeSource} />
    </SourcesContext.Provider>
  );
}

/** Puts focus on an element, making it focusable for the moment if it isn't. */
function focusBack(element: Element | null | undefined) {
  if (!(element instanceof HTMLElement) || !element.isConnected) return;
  if (element.tabIndex < 0 && !element.hasAttribute("tabindex")) {
    element.setAttribute("tabindex", "-1");
    element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  }
  element.focus({ preventScroll: true });
}

/**
 * The Sources dialog: centered, a bottom sheet on phones. It stays mounted through its exit, so
 * the CSS transition runs off `data-state`, then unmounts: a closed dialog leaves the page alone.
 */
function SourcesDialog({ onCustomHost }: { onCustomHost: (host: HTMLElement | null) => void }) {
  const sourcesState = useContext(SourcesContext)!;
  const closeDialog = useContext(ProvenanceContext)!.closeDialog;
  const { selection, sources, isOpen, clearSelection, setInspecting } = useArtifactProvenance();
  const { portalThemeClassName } = useTheme();
  /** A query opened from the list, for the selection it was opened under. */
  const [opened, setOpened] = useState<{ name: string; under: typeof selection } | null>(null);
  const query = opened && opened.under === selection ? opened.name : null;

  // Mounted while open, and through the exit.
  const [mounted, setMounted] = useState(isOpen);
  if (isOpen && !mounted) setMounted(true);
  useEffect(() => {
    if (isOpen || !mounted) return;
    const timer = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [isOpen, mounted]);

  // Radix keeps a modal's page locked (no pointer events on the body or past its overlay, the
  // rest hidden from screen readers) until it unmounts, which here is after the exit. Once closed,
  // the pointer is the page's again: the body gets back what it had, and the leaving overlay and
  // dialog let clicks through (`passThrough`). Reopened while still leaving, it locks again.
  const bodyPointerEvents = useRef("");
  const unlocked = useRef(false);
  useLayoutEffect(() => {
    const { style } = document.body;
    if (isOpen) {
      if (unlocked.current) style.pointerEvents = "none";
      else bodyPointerEvents.current = style.pointerEvents;
      unlocked.current = false;
    } else if (mounted && !unlocked.current) {
      style.pointerEvents = bodyPointerEvents.current;
      unlocked.current = true;
    } else if (!mounted) {
      unlocked.current = false;
    }
  }, [isOpen, mounted]);
  const passThrough = isOpen ? undefined : ({ pointerEvents: "none" } as const);

  // Focus goes back where it came from: the picked component, or what had it before. Noted before
  // the dialog takes focus; given back once it has unmounted and the page is no longer hidden from
  // screen readers, unless something else took focus meanwhile.
  const returnTo = useRef<Element | null>(null);
  const wasOpen = useRef(isOpen);
  useLayoutEffect(() => {
    if (isOpen && !wasOpen.current) {
      returnTo.current = selection?.propElement ?? selection?.element ?? document.activeElement;
      setOpened(null);
    }
    wasOpen.current = isOpen;
  }, [isOpen, selection]);
  const [content, setContent] = useState<HTMLElement | null>(null);
  const shown = useRef(false);
  useEffect(() => {
    if (content) shown.current = true;
    if (content || !shown.current) return;
    shown.current = false;
    const focused = document.activeElement;
    if (!focused || focused === document.body) focusBack(returnTo.current);
    returnTo.current = null;
  }, [content]);

  const panelSelection = useMemo(
    () => (selection ? { id: selection.id, prop: selection.prop } : null),
    [selection],
  );
  const custom = sourcesState.custom > 0;
  // A picked value is shown beside the title, as it reads on the dashboard.
  const meta = query ? undefined : selection?.propElement?.textContent?.trim() || undefined;
  const back = query ? () => setOpened(null) : selection ? clearSelection : undefined;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <Dialog.Portal forceMount={mounted || undefined}>
        <Dialog.Overlay
          className={clsx(dialogStyles.overlay, dialogNames.overlay, portalThemeClassName)}
          style={passThrough}
        />
        <Dialog.Content
          ref={setContent}
          className={clsx(
            dialogStyles.root,
            dialogStyles.body,
            dialogNames.root,
            portalThemeClassName,
          )}
          style={passThrough}
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => event.preventDefault()}
          // Still mounted while it leaves: an Escape then is the second step, out of inspect mode.
          onEscapeKeyDown={(event) => {
            if (isOpen) return;
            event.preventDefault();
            setInspecting(false);
          }}
          onTransitionEnd={(event) => {
            if (!isOpen && event.target === event.currentTarget) setMounted(false);
          }}
        >
          <header className={clsx(dialogStyles.header, dialogNames.header)}>
            {back && (
              <button
                type="button"
                className={clsx(dialogStyles.button, dialogNames.back)}
                aria-label="Back to all queries"
                title="Back to all queries"
                onClick={back}
              >
                <ArrowLeft size={16} aria-hidden />
              </button>
            )}
            <Dialog.Title className={clsx(dialogStyles.title, dialogNames.title)}>
              {sourcesTitle(sources, panelSelection, query)}
            </Dialog.Title>
            {meta && <span className={clsx(dialogStyles.meta, dialogNames.meta)}>{meta}</span>}
            <Dialog.Close
              className={clsx(dialogStyles.button, dialogStyles.close, dialogNames.close)}
              aria-label="Close"
              title="Close"
            >
              <X size={16} aria-hidden />
            </Dialog.Close>
          </header>
          {custom ? (
            <div ref={onCustomHost} className={clsx(dialogStyles.custom, dialogNames.custom)} />
          ) : (
            <DataSourcesContents
              sources={sources}
              selection={panelSelection}
              query={query}
              onOpenQuery={(name) => setOpened({ name, under: selection })}
              describeSource={sourcesState.options.describeSource}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
