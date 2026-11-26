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
import { DataSourcesContents, sourcesTitle } from "../SourcesContents";
import { dialogNames, dialogStyles } from "../SourcesContents/sourcesDialog.styles";
import type { DataSourcesContentsProps } from "../SourcesContents/types";
import { ProvenanceContext, useArtifactProvenance } from "./contexts";
import { focusBack } from "./focus";
import { SourcesPopover } from "./SourcesPopover";

/** What an app can tell the default Sources contents, through the `Provenance` slot's props. */
export type SourcesOptions = Pick<DataSourcesContentsProps, "describeSource">;

interface SourcesState {
  options: SourcesOptions;
  setOptions: (options: SourcesOptions) => void;
  /** How many `Provenance` slots have their own contents: above 0, the default ones step aside. */
  customCount: number;
  setCustom: (update: (count: number) => number) => void;
  /** Where the app's own contents go, inside the open popover or dialog. */
  customHost: HTMLElement | null;
}

export const SourcesContext = createContext<SourcesState | null>(null);

const NO_OPTIONS: SourcesOptions = {};
/** Longer than any exit (the phone sheet's 300ms), in case `transitionend` never comes. */
const EXIT_MS = 350;

/**
 * The artifact's content, and with provenance on, what opens over it: the selected item's Sources
 * popover, and the Sources dialog of every query.
 */
export function SourcesProvider({ children }: { children: ReactNode }) {
  const provenance = useContext(ProvenanceContext);
  const [options, setOptions] = useState<SourcesOptions>(NO_OPTIONS);
  const [customCount, setCustom] = useState(0);
  const [popoverHost, setPopoverHost] = useState<HTMLElement | null>(null);
  const [dialogHost, setDialogHost] = useState<HTMLElement | null>(null);
  const customHost = popoverHost ?? dialogHost;
  const state = useMemo<SourcesState>(
    () => ({ options, setOptions, customCount, setCustom, customHost }),
    [options, customCount, customHost],
  );

  if (!provenance) return <>{children}</>;
  return (
    <SourcesContext.Provider value={state}>
      {children}
      <SourcesPopover
        describeSource={options.describeSource}
        custom={customCount > 0}
        onCustomHost={setPopoverHost}
      />
      <SourcesDialog onCustomHost={setDialogHost} />
    </SourcesContext.Provider>
  );
}

/**
 * The Sources dialog of every query (an item opens its popover instead): centered, a bottom
 * sheet on phones. It stays mounted through its exit, so the CSS transition runs off
 * `data-state`, then unmounts: a closed dialog leaves the page alone.
 */
function SourcesDialog({ onCustomHost }: { onCustomHost: (host: HTMLElement | null) => void }) {
  const sourcesState = useContext(SourcesContext)!;
  const { closeDialog } = useContext(ProvenanceContext)!.internal;
  const { sources, isSourcesOpen: isOpen, setInspecting } = useArtifactProvenance();
  const { portalThemeClassName } = useTheme();
  /** A query opened from the list. */
  const [query, setQuery] = useState<string | null>(null);

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

  // Focus goes back where it came from, noted before the dialog takes focus and given back once
  // it has unmounted and the page is no longer hidden from screen readers, unless something else
  // took focus meanwhile.
  const returnTo = useRef<Element | null>(null);
  const wasOpen = useRef(isOpen);
  useLayoutEffect(() => {
    if (isOpen && !wasOpen.current) {
      returnTo.current = document.activeElement;
      setQuery(null);
    }
    wasOpen.current = isOpen;
  }, [isOpen]);
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

  const custom = sourcesState.customCount > 0;
  const back = query ? () => setQuery(null) : undefined;

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
              {sourcesTitle(sources, null, query)}
            </Dialog.Title>
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
              selection={null}
              query={query}
              onOpenQuery={setQuery}
              describeSource={sourcesState.options.describeSource}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
