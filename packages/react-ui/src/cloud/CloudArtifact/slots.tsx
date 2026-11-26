"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import clsx from "clsx";
import { ChevronDown, CircleAlert, Layers, LoaderCircle, X } from "lucide-react";
import { useContext, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { AnimatedLabel } from "./AnimatedLabel";
import { names, styles, toggleStyles } from "./cloudArtifact.styles";
import {
  ChromeOverridesContext,
  ContentConfigContext,
  PreviewOverridesContext,
  ProvenanceContext,
  RegionContext,
  useArtifactRenderer,
  type ArtifactRendererState,
  type Region,
} from "./contexts";
import { PendingLoader, type PendingLoaderProps } from "./PendingLoader";
import { SourcesContext, SourcesProvider, type SourcesOptions } from "./SourcesProvider";
import { BuildFeed, BuildFeedPanel, Dock, FeedPanel, stepWords } from "./StatusPill";
import { feedStyles } from "./statusPill.styles";

/*
 * Slots, following AgentInterface's three modes:
 *   • omit a slot     → the default renders
 *   • pass props      → the default renders with your values
 *   • pass children   → your children replace the default's look; a loader
 *                       or error still shows only while pending, loading or failed
 *
 * Regions (`Preview`, `Chrome`) go at the renderer's top level. Parts only
 * render inside their region: preview parts in `Preview`, chrome parts in
 * `Chrome`, `Pending`/`Loading`/`Error`/`Provenance` in `Content`.
 */

/** Is this part inside its region? Outside it, the part renders nothing. */
function useInRegion(region: Region): boolean {
  return useContext(RegionContext).has(region);
}

export function RegionProvider({ region, children }: { region: Region; children: ReactNode }) {
  const parent = useContext(RegionContext);
  const value = useMemo(() => new Set([...parent, region]), [parent, region]);
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

const Spinner = () => (
  <LoaderCircle className={clsx(styles.spinner, names.spinner)} size={14} aria-hidden />
);

/** What a dashboard being built is doing, by name: calling data tools, else writing and testing scripts. */
const stepLabel = (step: ArtifactBuildStep | undefined) => {
  const words = step && stepWords(step);
  return words && `${words.verb} ${words.names}`;
};

/** The status line where there's no build feed: the bar while data loads, or a custom loader. */
const statusLabel = ({ step, isPending, isStreaming }: ArtifactRendererState) =>
  `${stepLabel(step) ?? (isPending ? "Preparing" : isStreaming ? "Generating" : "Loading data")}…`;

/** A status line: the text shimmers, and a new one drifts in. */
const StatusText = ({ text }: { text: string }) => (
  <AnimatedLabel
    text={text}
    className={clsx(styles.shimmer, styles.loaderText, names.loaderText)}
  />
);

// ─── Preview region ──────────────────────────────────────────────────────

export interface PreviewProps {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

/** The card in the chat that opens the artifact. */
export function Preview({ title, description, className, children }: PreviewProps) {
  const state = useArtifactRenderer();
  const overrides = useMemo(() => ({ title, description }), [title, description]);
  if (children !== undefined) return <>{children}</>;
  return (
    <PreviewOverridesContext.Provider value={overrides}>
      <button
        type="button"
        className={clsx(styles.preview, names.preview, className)}
        onClick={state.isOpen ? state.close : state.open}
        aria-expanded={state.isOpen}
      >
        <span className={clsx(styles.previewText, names.previewText)}>
          <PreviewTitle />
          <PreviewDescription />
        </span>
        <PreviewLoader />
        <PreviewError />
      </button>
    </PreviewOverridesContext.Provider>
  );
}

export interface PartProps {
  className?: string;
  children?: ReactNode;
}

export function PreviewTitle({ className, children }: PartProps) {
  const inside = useInRegion("preview");
  const state = useArtifactRenderer();
  const overrides = useContext(PreviewOverridesContext);
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx(styles.previewTitle, names.previewTitle, className)}>
      {overrides.title ?? state.title ?? "Untitled artifact"}
    </span>
  );
}

export function PreviewDescription({ className, children }: PartProps) {
  const inside = useInRegion("preview");
  const { description } = useContext(PreviewOverridesContext);
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  if (!description) return null;
  return (
    <span className={clsx(styles.previewDescription, names.previewDescription, className)}>
      {description}
    </span>
  );
}

export interface LoaderProps {
  label?: string;
  children?: ReactNode;
}

/**
 * The card's status while the artifact loads: while it's pending or streaming, the build feed on
 * its own line; otherwise a pill. `PreviewError` takes its place after a failure.
 */
export function PreviewLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("preview");
  const state = useArtifactRenderer();
  if (!inside || !state.isLoading || state.error) return null;
  if (children !== undefined) return <>{children}</>;
  if (label === undefined && (state.isPending || state.isStreaming)) {
    return <BuildFeed className={styles.previewFeed} />;
  }
  const text = label ?? statusLabel(state);
  return (
    <span
      className={clsx(styles.loader, styles.pill, styles.pillInfo, names.loader)}
      role="status"
      title={text}
    >
      <Spinner />
      <StatusText text={text} />
    </span>
  );
}

/** The card's error: why the artifact can't be shown, or which data tool failed. */
export function PreviewError({ message, children }: ErrorProps) {
  const inside = useInRegion("preview");
  const state = useArtifactRenderer();
  if (!inside || !state.error) return null;
  if (children !== undefined) return <>{children}</>;
  const text = message ?? state.error.message;
  return (
    <span
      className={clsx(styles.loader, styles.pill, styles.pillDanger, names.previewError)}
      role="alert"
      title={text}
    >
      <CircleAlert size={14} aria-hidden />
      <span className={styles.loaderText}>{text}</span>
    </span>
  );
}

// ─── Chrome region ───────────────────────────────────────────────────────

export interface ChromeProps {
  title?: string;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** The frame around the open artifact: a bar with its title, loader and actions, then the artifact. */
export function Chrome({ title, actions, className, children }: ChromeProps) {
  const overrides = useMemo(() => ({ title, actions }), [title, actions]);
  if (children !== undefined) return <>{children}</>;
  return (
    <ChromeOverridesContext.Provider value={overrides}>
      <div className={clsx(styles.chrome, names.chrome, className)}>
        <div className={clsx(styles.chromeBar, names.chromeBar)}>
          <ChromeTitle />
          <ChromeLoader />
          <EditedNotice />
          <ChromeActions />
        </div>
        <Content>
          <Pending />
          <ErrorSlot />
        </Content>
      </div>
    </ChromeOverridesContext.Provider>
  );
}

export function ChromeTitle({ className, children }: PartProps) {
  const inside = useInRegion("chrome");
  const state = useArtifactRenderer();
  const overrides = useContext(ChromeOverridesContext);
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx(styles.chromeTitle, names.chromeTitle, className)}>
      {overrides.title ?? state.title ?? "Untitled artifact"}
    </span>
  );
}

/** The bar's status while the artifact loads. While a build runs, its feed says it instead. */
export function ChromeLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("chrome");
  const state = useArtifactRenderer();
  if (!inside || !state.isLoading || state.isPending || state.isStreaming) return null;
  if (children !== undefined) return <>{children}</>;
  const text = label ?? statusLabel(state);
  return (
    <span className={clsx(styles.loader, names.loader)} role="status" title={text}>
      <Spinner />
      <StatusText text={text} />
    </span>
  );
}

export interface EditedNoticeProps {
  label?: string;
  children?: ReactNode;
}

/** "Edited just now", for a few seconds after a newer version finishes replacing the one on screen. */
export function EditedNotice({ label, children }: EditedNoticeProps) {
  const inside = useInRegion("chrome");
  const state = useArtifactRenderer();
  if (!inside || !state.justUpdated || state.isLoading) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx(styles.loader, names.edited)} role="status">
      {label ?? "Edited just now"}
    </span>
  );
}

export function ChromeActions({ className, children }: PartProps) {
  const inside = useInRegion("chrome");
  const overrides = useContext(ChromeOverridesContext);
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <div className={clsx(styles.chromeActions, names.chromeActions, className)}>
      {overrides.actions}
      <ProvenanceToggle />
      <CloseButton />
    </div>
  );
}

export interface CloseButtonProps {
  label?: string;
  children?: ReactNode;
}

/** Closes the artifact. Renders nothing in standalone mode. */
export function CloseButton({ label, children }: CloseButtonProps) {
  const inside = useInRegion("chrome");
  const state = useArtifactRenderer();
  if (!inside || !state.preview) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <IconButton
      className={names.close}
      variant="tertiary"
      size="small"
      icon={<X size={16} />}
      aria-label={label ?? "Close"}
      onClick={state.close}
    />
  );
}

export interface ProvenanceToggleProps {
  label?: string;
  children?: ReactNode;
}

/**
 * The Sources split button. Its main half turns inspect mode on and off, with `aria-pressed` and
 * `data-state="on" | "off"`; its chevron opens the All sources menu under it, with
 * `aria-expanded` and `data-state="open" | "closed"`. Renders nothing unless `enableProvenance`
 * is on. Children replace it: call `setInspecting` and `openAllSources` from
 * `useArtifactProvenance()` from your own controls.
 */
export function ProvenanceToggle({ label, children }: ProvenanceToggleProps) {
  const inside = useInRegion("chrome");
  const provenance = useContext(ProvenanceContext);
  if (!inside || !provenance) return null;
  if (children !== undefined) return <>{children}</>;
  const on = provenance.isInspecting;
  const menuOpen = provenance.isAllSourcesOpen;
  return (
    <div className={clsx(toggleStyles.split, names.sourcesSplit)} role="group">
      <button
        type="button"
        className={clsx(toggleStyles.half, toggleStyles.main, names.provenanceToggle)}
        aria-pressed={on}
        data-state={on ? "on" : "off"}
        onClick={() => {
          if (on) provenance.clearSelection();
          provenance.setInspecting(!on);
        }}
      >
        <Layers size={16} aria-hidden />
        {label ?? "Sources"}
      </button>
      <span className={toggleStyles.divider} aria-hidden />
      <button
        type="button"
        className={clsx(toggleStyles.half, toggleStyles.chevron, names.sourcesChevron)}
        aria-label="All sources"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        data-state={menuOpen ? "open" : "closed"}
        onClick={(event) => {
          if (menuOpen) {
            provenance.internal.closeMenu();
            return;
          }
          // Safari doesn't focus a clicked button: focus comes back here when the menu closes.
          event.currentTarget.focus({ preventScroll: true });
          provenance.openAllSources();
        }}
      >
        <ChevronDown size={16} aria-hidden />
      </button>
    </div>
  );
}

// ─── Content and its parts ───────────────────────────────────────────────

/** The artifact itself, with a loader over it while it loads and a message if it fails. */
export function Content({ className, children }: PartProps) {
  const inside = useInRegion("chrome");
  const config = useContext(ContentConfigContext);
  // A build watched from its start (pending, then streaming) keeps its feed on screen throughout.
  const { isPending } = useArtifactRenderer();
  const [sawPending, setSawPending] = useState(false);
  if (isPending && !sawPending) setSawPending(true);
  // On the content, not the root: with `renderInHtmlElement` the content is portaled out of it.
  const inspecting = useContext(ProvenanceContext)?.isInspecting ?? false;
  if (!inside || !config) return null;
  return (
    <RegionProvider region="content">
      {/* With provenance on, the Sources popover and the All sources menu open over the content. */}
      <SourcesProvider>
        <div
          className={clsx(
            styles.content,
            names.content,
            inspecting && [styles.inspecting, names.inspecting],
            className,
          )}
        >
          {/* Above the artifact, so an error reads first. */}
          {children === undefined ? (
            <>
              <Pending />
              <Loading />
              <ErrorSlot />
            </>
          ) : (
            children
          )}
          {config.render()}
          <BuildDock fromStart={sawPending} />
        </div>
      </SourcesProvider>
    </RegionProvider>
  );
}

export interface PendingProps extends PendingLoaderProps {
  children?: ReactNode;
}

/**
 * Before the artifact has anything to show: a dotted sketch of a dashboard, drawn widget by widget,
 * while the tool call that makes it runs and on through a build, with the build's feed over it.
 */
export function Pending({ children, ...loader }: PendingProps) {
  const inside = useInRegion("content");
  const state = useArtifactRenderer();
  if (!inside || !state.isPending) return null;
  if (children !== undefined) return <>{children}</>;
  return <PendingLoader {...loader} />;
}

/**
 * Once the dashboard is on screen (an edit, or a new one being written): the build's feed, in the
 * middle until the dashboard fills the top half, then at the bottom. Before that, `Pending` shows it.
 */
function BuildDock({ fromStart }: { fromStart: boolean }) {
  const state = useArtifactRenderer();
  if (!state.isStreaming || state.isPending) return null;
  // Opening a saved dashboard replays its stream for a moment: delayed, that never shows. A build
  // seen from its start, or an edit, shows at once.
  return (
    <Dock delayed={!fromStart && !state.isEditing}>
      <BuildFeedPanel />
    </Dock>
  );
}

/** While the data loads: "Loading data…", in the capsule a build's feed uses. */
export function Loading({ label, children }: LoaderProps) {
  const inside = useInRegion("content");
  const state = useArtifactRenderer();
  // While pending, `Pending` has the content to itself; while it streams, the build feed.
  if (!inside || !state.isLoading || state.isPending || state.isStreaming || state.error) {
    return null;
  }
  if (children !== undefined) return <>{children}</>;
  const text = label ?? statusLabel(state);
  return (
    <Dock delayed at="bottom">
      <FeedPanel>
        <span className={clsx(feedStyles.line, names.loading)} role="status" title={text}>
          <Spinner />
          <StatusText text={text} />
        </span>
      </FeedPanel>
    </Dock>
  );
}

export interface ErrorProps {
  message?: string;
  children?: ReactNode;
}

function ErrorSlot({ message, children }: ErrorProps) {
  const inside = useInRegion("content");
  const state = useArtifactRenderer();
  const config = useContext(ContentConfigContext);
  if (!inside || !state.error) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <div
      className={clsx(
        styles.error,
        names.error,
        // Nothing to show under it (deleted, unshared, never loaded): in the middle.
        config?.isEmpty && [styles.errorEmpty, names.errorEmpty],
      )}
      role="alert"
    >
      <span>{message ?? state.error.message}</span>
      {state.retry && (
        <Button variant="secondary" size="small" onClick={state.retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export { ErrorSlot as Error };

export interface ProvenanceProps extends SourcesOptions {
  children?: ReactNode;
}

/**
 * The contents of a picked item's Sources popover and of the All sources menu. Without children,
 * the default contents list the selected component's sources (or every source) and show where
 * each one's data comes from; its props name your data tools (`describeSource`). With children,
 * yours replace them inside the popover or menu, under its header: read the selection and its
 * sources with `useArtifactProvenance()`. They render only while one is open.
 */
export function Provenance({ children, describeSource }: ProvenanceProps) {
  const inside = useInRegion("content");
  const sources = useContext(SourcesContext);
  const hasChildren = children !== undefined;
  const setOptions = sources?.setOptions;
  const setCustom = sources?.setCustom;
  useLayoutEffect(() => {
    if (!inside || hasChildren || !setOptions) return;
    setOptions({ describeSource });
    return () => setOptions({});
  }, [inside, hasChildren, setOptions, describeSource]);
  useLayoutEffect(() => {
    if (!inside || !hasChildren || !setCustom) return;
    setCustom((count) => count + 1);
    return () => setCustom((count) => count - 1);
  }, [inside, hasChildren, setCustom]);
  const host = sources?.customHost;
  if (!inside || !hasChildren || !host) return null;
  return createPortal(children, host);
}
