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

  // Focus goes back where it came from: the picked component, or what had it before. Noted before
  // the dialog takes focus; given back once its focus trap has let go.
  const returnTo = useRef<Element | null>(null);
  const wasOpen = useRef(isOpen);
  useLayoutEffect(() => {
    if (isOpen && !wasOpen.current) {
      returnTo.current = selection?.propElement ?? selection?.element ?? document.activeElement;
      setOpened(null);
    }
  }, [isOpen, selection]);
  useEffect(() => {
    if (!isOpen && wasOpen.current) {
      focusBack(returnTo.current);
      returnTo.current = null;
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  const panelSelection = useMemo(
    () => (selection ? { id: selection.id, prop: selection.prop } : null),
    [selection],
  );
  const custom = sourcesState.custom > 0;
  const back = query ? () => setOpened(null) : selection ? clearSelection : undefined;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <Dialog.Portal forceMount={mounted || undefined}>
        <Dialog.Overlay
          className={clsx(dialogStyles.overlay, dialogNames.overlay, portalThemeClassName)}
        />
        <Dialog.Content
          className={clsx(
            dialogStyles.root,
            dialogStyles.body,
            dialogNames.root,
            portalThemeClassName,
          )}
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
              {sourcesTitle(panelSelection, query)}
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
