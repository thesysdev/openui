"use client";

import type { ArtifactBuildStep } from "@openuidev/react-headless";
import clsx from "clsx";
import { CircleAlert, LoaderCircle, X } from "lucide-react";
import { useContext, useMemo, type ReactNode } from "react";
import { Button } from "../../components/Button";
import { IconButton } from "../../components/IconButton";
import { AnimatedLabel } from "./AnimatedLabel";
import { names, styles } from "./cloudArtifact.styles";
import {
  ChromeOverridesContext,
  ContentConfigContext,
  PreviewOverridesContext,
  RegionContext,
  useArtifactRenderer,
  type ArtifactRendererState,
  type Region,
} from "./contexts";
import { PendingLoader, type PendingLoaderProps } from "./PendingLoader";

/*
 * Slots, following AgentInterface's three modes:
 *   • omit a slot     → the default renders
 *   • pass props      → the default renders with your values
 *   • pass children   → your children replace the default's look; a loader
 *                       or error still shows only while pending, loading or failed
 *
 * Regions (`Preview`, `Chrome`) go at the renderer's top level. Parts only
 * render inside their region: preview parts in `Preview`, chrome parts in
 * `Chrome`, `Pending`/`Loading`/`Error` in `Content`.
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

/** A step's names, as they are: "a", "a and b", or "a, b and 2 more". */
const nameList = (names: string[]) =>
  names.length <= 2
    ? names.join(" and ")
    : `${names[0]}, ${names[1]} and ${names.length - 2} more`;

/** What a dashboard being built is doing, by name: calling data tools, else writing and testing scripts. */
const stepLabel = (step: ArtifactBuildStep | undefined) =>
  !step
    ? undefined
    : step.tools.length > 0
      ? `Calling ${nameList(step.tools)}`
      : `Writing and testing ${nameList(step.scripts)}`;

/** The one status line the card, the bar, the content and the pending skeleton all show. */
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

/** The card's status while the artifact loads. `PreviewError` takes its place after a failure. */
export function PreviewLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("preview");
  const state = useArtifactRenderer();
  if (!inside || !state.isLoading || state.error) return null;
  if (children !== undefined) return <>{children}</>;
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

/** The bar's status while the artifact loads. While pending, `Pending`'s note says it instead. */
export function ChromeLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("chrome");
  const state = useArtifactRenderer();
  if (!inside || !state.isLoading || state.isPending) return null;
  if (children !== undefined) return <>{children}</>;
  const text = label ?? statusLabel(state);
  return (
    <span className={clsx(styles.loader, names.loader)} role="status" title={text}>
      <Spinner />
      <StatusText text={text} />
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

// ─── Content and its parts ───────────────────────────────────────────────

/** The artifact itself, with a loader over it while it loads and a message if it fails. */
export function Content({ className, children }: PartProps) {
  const inside = useInRegion("chrome");
  const config = useContext(ContentConfigContext);
  if (!inside || !config) return null;
  return (
    <RegionProvider region="content">
      <div className={clsx(styles.content, names.content, className)}>
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
  const state = useArtifactRenderer();
  if (!inside || !state.isPending) return null;
  if (children !== undefined) return <>{children}</>;
  return <PendingLoader {...loader} label={label ?? statusLabel(state)} />;
}

export function Loading({ label, children }: LoaderProps) {
  const inside = useInRegion("content");
  const state = useArtifactRenderer();
  const config = useContext(ContentConfigContext);
  // While pending, `Pending` has the content to itself.
  if (!inside || !state.isLoading || state.isPending || state.error) return null;
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
  if (!inside || !state.error) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <div className={clsx(styles.error, names.error)} role="alert">
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
