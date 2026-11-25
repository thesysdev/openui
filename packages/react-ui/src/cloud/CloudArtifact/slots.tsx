"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import clsx from "clsx";
import { Database, List, LoaderCircle, X } from "lucide-react";
import { useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { TooltipWrapper } from "../../components/TooltipWrapper";
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
import { SourcesContext, SourcesProvider, type SourcesOptions } from "./SourcesDialog";

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

/** What a dashboard being built is doing: reading data while it calls tools, else preparing scripts. */
const stepLabel = (step: ArtifactBuildStep | undefined) =>
  !step ? undefined : step.tools.length > 0 ? "Reading your data" : "Preparing your data";

const loadingLabel = ({ step, isPending, isStreaming }: ArtifactRendererState) => {
  const doing = stepLabel(step);
  if (doing) return `${doing}…`;
  return isPending ? "Preparing…" : isStreaming ? "Generating…" : "Loading data…";
};

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

/** The card's status while the artifact loads: the text shimmers, and a new one drifts in. */
export function PreviewLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("preview");
  const state = useArtifactRenderer();
  if (!inside || !state.isLoading) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx(styles.loader, names.loader)} role="status">
      <Spinner />
      <AnimatedLabel
        text={label ?? loadingLabel(state)}
        className={clsx(styles.shimmer, names.loaderText)}
      />
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
        <Content />
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

export function ChromeLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("chrome");
  const state = useArtifactRenderer();
  // While pending, `Pending` says what's happening, in the content.
  if (!inside || !state.isLoading || state.isPending) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx(styles.loader, names.loader)} role="status">
      <Spinner />
      {label ?? loadingLabel(state)}
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
 * Turns inspect mode on and off, with `aria-pressed` and `data-state="on" | "off"`; while on, an
 * All queries button beside it opens the Sources dialog on the list. Renders nothing unless
 * `enableProvenance` is on. Children replace both: call `openList()` from
 * `useArtifactProvenance()` for your own All queries.
 */
export function ProvenanceToggle({ label, children }: ProvenanceToggleProps) {
  const inside = useInRegion("chrome");
  const provenance = useContext(ProvenanceContext);
  if (!inside || !provenance) return null;
  if (children !== undefined) return <>{children}</>;
  const open = provenance.isInspecting;
  return (
    <>
      {/* Before the toggle, so the toggle stays put under the pointer when this appears. */}
      {open && (
        <TooltipWrapper tooltipContent="All queries" side="bottom" align="center">
          <IconButton
            className={clsx(toggleStyles.allQueries, names.allQueries)}
            variant="tertiary"
            size="small"
            icon={<List size={16} aria-hidden />}
            aria-label="All queries"
            onClick={provenance.openList}
          />
        </TooltipWrapper>
      )}
      <Button
        className={clsx(toggleStyles.toggle, names.provenanceToggle)}
        variant="tertiary"
        size="small"
        iconLeft={
          <span className={toggleStyles.icon}>
            <Database size={16} aria-hidden />
            <span className={clsx(toggleStyles.dot, names.provenanceDot)} aria-hidden />
          </span>
        }
        aria-pressed={open}
        data-state={open ? "on" : "off"}
        onClick={() => {
          if (open) provenance.clearSelection();
          provenance.setInspecting(!open);
        }}
      >
        {label ?? "Sources"}
      </Button>
    </>
  );
}

// ─── Content and its parts ───────────────────────────────────────────────

/** The artifact itself, with a loader over it while it loads and a message if it fails. */
export function Content({ className, children }: PartProps) {
  const inside = useInRegion("chrome");
  const config = useContext(ContentConfigContext);
  // On the content, not the root: with `renderInHtmlElement` the content is portaled out of it.
  const inspecting = useContext(ProvenanceContext)?.isInspecting ?? false;
  if (!inside || !config) return null;
  return (
    <RegionProvider region="content">
      {/* With provenance on, the Sources dialog opens over the content. */}
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
        </div>
      </SourcesProvider>
    </RegionProvider>
  );
}

export interface PendingProps extends PendingLoaderProps {
  children?: ReactNode;
}

/**
 * Before the artifact has anything to show: a skeleton dashboard that rearranges itself, while the
 * tool call that makes it runs and on through a build, saying what the build is doing.
 */
export function Pending({ children, label, ...loader }: PendingProps) {
  const inside = useInRegion("content");
  const { isPending, step } = useArtifactRenderer();
  if (!inside || !isPending) return null;
  if (children !== undefined) return <>{children}</>;
  return <PendingLoader {...loader} label={label ?? stepLabel(step)} />;
}

export function Loading({ label, children }: LoaderProps) {
  const inside = useInRegion("content");
  const state = useArtifactRenderer();
  const config = useContext(ContentConfigContext);
  // While pending, `Pending` has the content to itself.
  if (!inside || !state.isLoading || state.isPending || state.error) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <div
      className={clsx(
        styles.loading,
        names.loading,
        config?.isEmpty && [styles.loadingEmpty, names.loadingEmpty],
      )}
      role="status"
    >
      <Spinner />
      {label ?? loadingLabel(state)}
    </div>
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
 * The Sources dialog's contents. Without children, the default contents list the dashboard's
 * sources and show where the selected component's data comes from; its props name your data tools
 * (`describeSource`). With children, yours replace them inside the dialog, under its title, back
 * and close: read the selection and its sources with `useArtifactProvenance()`. They render only
 * while the dialog is open.
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
