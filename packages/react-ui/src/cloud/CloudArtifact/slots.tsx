"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import clsx from "clsx";
import { CircleAlert, Database, LoaderCircle, X } from "lucide-react";
import { useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { AnimatedLabel } from "./AnimatedLabel";
import { BuildFeed, DockedBuildFeed } from "./BuildFeed";
import { isBuildActive, stepWords, useBuildFeed, type ArtifactBuild } from "./buildTracker";
import { names, styles } from "./cloudArtifact.styles";
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
import { SourcesDockContext, SourcesWorkspace, type SourcesOptions } from "./SourcesDock";

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
      <div className={clsx(styles.preview, names.preview, className)}>
        {/* Its click area covers the card; the feed's own button sits above it. */}
        <button
          type="button"
          className={clsx(styles.previewOpen, styles.previewText, names.previewText)}
          onClick={state.isOpen ? state.close : state.open}
          aria-expanded={state.isOpen}
        >
          <PreviewTitle />
          <PreviewDescription />
        </button>
        <PreviewLoader />
        <PreviewError />
      </div>
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
 * The card's status. For a build: its feed, which stays once it ends ("Ready · 2 tool calls 41s").
 * Otherwise a pill while the artifact loads; `PreviewError` takes its place after a failure.
 */
export function PreviewLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("preview");
  const state = useArtifactRenderer();
  const { build, noun } = useBuildFeed();
  const feed = label === undefined ? build : undefined;
  if (!inside || (!feed && (!state.isLoading || state.error))) return null;
  if (children !== undefined) return <>{children}</>;
  if (feed) return <BuildFeed build={feed} noun={noun} className={styles.previewFeed} />;
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
  const { build } = useBuildFeed();
  // A failed build's feed says so already.
  if (!inside || !state.error || build?.phase === "failed") return null;
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
  const { build } = useBuildFeed();
  const building = build !== undefined && isBuildActive(build);
  if (!inside || !state.isLoading || state.isPending || building) return null;
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

/** Turns inspect mode on and off. Renders nothing unless `enableProvenance` is on. */
export function ProvenanceToggle({ label, children }: ProvenanceToggleProps) {
  const inside = useInRegion("chrome");
  const provenance = useContext(ProvenanceContext);
  if (!inside || !provenance) return null;
  if (children !== undefined) return <>{children}</>;
  const open = provenance.isInspecting;
  return (
    <Button
      className={names.provenanceToggle}
      variant={open ? "secondary" : "tertiary"}
      size="small"
      iconLeft={<Database size={16} aria-hidden />}
      aria-pressed={open}
      onClick={() => {
        if (open) provenance.clearSelection();
        provenance.setInspecting(!open);
      }}
    >
      {label ?? "Sources"}
    </Button>
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
      {/* With provenance on, the Sources panel docks beside the content. */}
      <SourcesWorkspace>
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
          <BuildDock />
        </div>
      </SourcesWorkspace>
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

/** How long the docked feed stays after the build ends, so its last line can be read. */
const DOCK_LINGER_MS = 2500;

/** The build while it runs and for a moment after. */
function useLingeringBuild(): ArtifactBuild | undefined {
  const { build } = useBuildFeed();
  const endedAt = build?.endedAt;
  const [, expire] = useState(0);
  const lingering = endedAt !== undefined && Date.now() - endedAt < DOCK_LINGER_MS;
  useEffect(() => {
    if (!lingering || endedAt === undefined) return;
    const timer = setTimeout(() => expire((n) => n + 1), DOCK_LINGER_MS - (Date.now() - endedAt));
    return () => clearTimeout(timer);
  }, [lingering, endedAt]);
  return build && (isBuildActive(build) || lingering) ? build : undefined;
}

/**
 * Once the dashboard is on screen (an edit, or a new one being written): the build's feed, in the
 * middle until the dashboard fills the top half, then at the bottom. Before that, `Pending` shows it.
 */
function BuildDock() {
  const state = useArtifactRenderer();
  const { noun } = useBuildFeed();
  const build = useLingeringBuild();
  if (!build || state.isPending) return null;
  return <DockedBuildFeed build={build} noun={noun} />;
}

export function Loading({ label, children }: LoaderProps) {
  const inside = useInRegion("content");
  const state = useArtifactRenderer();
  const config = useContext(ContentConfigContext);
  const { build } = useBuildFeed();
  // While pending, `Pending` has the content to itself; while a build runs, its feed.
  const building = build !== undefined && isBuildActive(build);
  if (!inside || !state.isLoading || state.isPending || building || state.error) return null;
  if (children !== undefined) return <>{children}</>;
  const text = label ?? statusLabel(state);
  return (
    <div
      className={clsx(
        styles.loading,
        names.loading,
        config?.isEmpty && [styles.loadingEmpty, names.loadingEmpty],
      )}
      role="status"
      title={text}
    >
      <Spinner />
      <StatusText text={text} />
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
 * The Sources panel. Without children, the default panel docks beside the content: it lists the
 * dashboard's sources and shows where the selected component's data comes from; its props name
 * your data tools (`describeSource`). With
 * children, your panel replaces it: read the selection and its sources with
 * `useArtifactProvenance()`. Your panel renders only while something is selected.
 */
export function Provenance({ children, describeSource }: ProvenanceProps) {
  const inside = useInRegion("content");
  const provenance = useContext(ProvenanceContext);
  const dock = useContext(SourcesDockContext);
  const hasChildren = children !== undefined;
  const setOptions = dock?.setOptions;
  const setCustom = dock?.setCustom;
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
  if (!inside || !hasChildren || !provenance?.selection) return null;
  return <>{children}</>;
}
