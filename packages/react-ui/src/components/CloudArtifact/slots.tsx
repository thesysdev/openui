"use client";

import clsx from "clsx";
import { LoaderCircle, X } from "lucide-react";
import { useContext, useEffect, useMemo, type ReactNode } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import {
  ChromeOverridesContext,
  ContentConfigContext,
  PreviewOverridesContext,
  RegionContext,
  useArtifactRenderer,
  type Region,
} from "./contexts";

/*
 * Slots, following AgentInterface's three modes:
 *   • omit a slot     → the default renders
 *   • pass props      → the default renders with your values
 *   • pass children   → your children replace the default entirely
 *
 * Regions (`Preview`, `Chrome`) go at the renderer's top level. Parts only
 * render inside their region: preview parts in `Preview`, chrome parts in
 * `Chrome`, `Loading`/`Error` in `Content`.
 */

// Bundlers replace `process.env.NODE_ENV`; where nothing does, `process` may
// not exist, so read it inside a try.
const isDev = () => {
  try {
    return process.env["NODE_ENV"] !== "production";
  } catch {
    return false;
  }
};

const warned = new Set<string>();
export function warnOnce(key: string, message: string): void {
  if (!isDev() || warned.has(key)) return;
  warned.add(key);
  console.warn(`[@openuidev/react-ui/cloud] ${message}`);
}

function useChildrenWinWarning(
  slot: string,
  children: ReactNode,
  props: Record<string, unknown>,
): void {
  const hasProps = Object.values(props).some((value) => value !== undefined);
  const hasChildren = children !== undefined;
  useEffect(() => {
    if (hasChildren && hasProps) {
      warnOnce(
        `${slot}:both`,
        `<${slot}> got both children and props. Children replace the default, so the props are ignored.`,
      );
    }
  }, [slot, hasChildren, hasProps]);
}

/** Is this part inside its region? Warns once when it isn't. */
function useInRegion(part: string, region: Region): boolean {
  const regions = useContext(RegionContext);
  const inside = regions.has(region);
  useEffect(() => {
    if (!inside) {
      warnOnce(
        `${part}:region`,
        `<${part}> only renders inside its region (${region}). It rendered nothing.`,
      );
    }
  }, [inside, part, region]);
  return inside;
}

export function RegionProvider({ region, children }: { region: Region; children: ReactNode }) {
  const parent = useContext(RegionContext);
  const value = useMemo(() => new Set([...parent, region]), [parent, region]);
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

const Spinner = () => <LoaderCircle className="openui-artifact-spinner" size={14} aria-hidden />;

const loadingLabel = (isStreaming: boolean) => (isStreaming ? "Generating…" : "Loading data…");

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
  useChildrenWinWarning("Preview", children, { title, description, className });
  const overrides = useMemo(() => ({ title, description }), [title, description]);
  if (children !== undefined) return <>{children}</>;
  return (
    <PreviewOverridesContext.Provider value={overrides}>
      <button
        type="button"
        className={clsx("openui-artifact-preview", className)}
        onClick={state.isOpen ? state.close : state.open}
        aria-expanded={state.isOpen}
      >
        <span className="openui-artifact-preview-text">
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
  const inside = useInRegion("PreviewTitle", "preview");
  const state = useArtifactRenderer();
  const overrides = useContext(PreviewOverridesContext);
  useChildrenWinWarning("PreviewTitle", children, { className });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx("openui-artifact-preview-title", className)}>
      {overrides.title ?? state.title ?? "Untitled artifact"}
    </span>
  );
}

export function PreviewDescription({ className, children }: PartProps) {
  const inside = useInRegion("PreviewDescription", "preview");
  const state = useArtifactRenderer();
  const overrides = useContext(PreviewOverridesContext);
  useChildrenWinWarning("PreviewDescription", children, { className });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  const description = overrides.description ?? state.description;
  if (!description) return null;
  return (
    <span className={clsx("openui-artifact-preview-description", className)}>{description}</span>
  );
}

export interface LoaderProps {
  label?: string;
  children?: ReactNode;
}

export function PreviewLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("PreviewLoader", "preview");
  const state = useArtifactRenderer();
  useChildrenWinWarning("PreviewLoader", children, { label });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  if (!state.isLoading) return null;
  return (
    <span className="openui-artifact-loader" role="status">
      <Spinner />
      {label ?? loadingLabel(state.isStreaming)}
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
  useChildrenWinWarning("Chrome", children, { title, actions, className });
  const overrides = useMemo(() => ({ title, actions }), [title, actions]);
  if (children !== undefined) return <>{children}</>;
  return (
    <ChromeOverridesContext.Provider value={overrides}>
      <div className={clsx("openui-artifact-chrome", className)}>
        <div className="openui-artifact-chrome-bar">
          <ChromeTitle />
          <ChromeLoader />
          <ChromeActions />
        </div>
        <Content />
      </div>
    </ChromeOverridesContext.Provider>
  );
}

export function ChromeTitle({ className, children }: PartProps) {
  const inside = useInRegion("ChromeTitle", "chrome");
  const state = useArtifactRenderer();
  const overrides = useContext(ChromeOverridesContext);
  useChildrenWinWarning("ChromeTitle", children, { className });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <span className={clsx("openui-artifact-chrome-title", className)}>
      {overrides.title ?? state.title ?? "Untitled artifact"}
    </span>
  );
}

export function ChromeLoader({ label, children }: LoaderProps) {
  const inside = useInRegion("ChromeLoader", "chrome");
  const state = useArtifactRenderer();
  useChildrenWinWarning("ChromeLoader", children, { label });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  if (!state.isLoading) return null;
  return (
    <span className="openui-artifact-loader" role="status">
      <Spinner />
      {label ?? loadingLabel(state.isStreaming)}
    </span>
  );
}

export function ChromeActions({ className, children }: PartProps) {
  const inside = useInRegion("ChromeActions", "chrome");
  const overrides = useContext(ChromeOverridesContext);
  useChildrenWinWarning("ChromeActions", children, { className });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <div className={clsx("openui-artifact-chrome-actions", className)}>
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
  const inside = useInRegion("CloseButton", "chrome");
  const state = useArtifactRenderer();
  useChildrenWinWarning("CloseButton", children, { label });
  if (!inside || !state.preview) return null;
  if (children !== undefined) return <>{children}</>;
  return (
    <IconButton
      className="openui-artifact-close"
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
  const inside = useInRegion("Content", "chrome");
  const config = useContext(ContentConfigContext);
  if (!inside || !config) return null;
  return (
    <RegionProvider region="content">
      <div className={clsx("openui-artifact-content", className)}>
        {config.render()}
        {children === undefined ? (
          <>
            <Loading />
            <ErrorSlot />
          </>
        ) : (
          children
        )}
      </div>
    </RegionProvider>
  );
}

export function Loading({ label, children }: LoaderProps) {
  const inside = useInRegion("Loading", "content");
  const state = useArtifactRenderer();
  const config = useContext(ContentConfigContext);
  useChildrenWinWarning("Loading", children, { label });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  if (!state.isLoading || state.error) return null;
  return (
    <div
      className={clsx(
        "openui-artifact-loading",
        config?.isEmpty && "openui-artifact-loading-empty",
      )}
      role="status"
    >
      <Spinner />
      {label ?? loadingLabel(state.isStreaming)}
    </div>
  );
}

export interface ErrorProps {
  message?: string;
  children?: ReactNode;
}

function ErrorSlot({ message, children }: ErrorProps) {
  const inside = useInRegion("Error", "content");
  const state = useArtifactRenderer();
  useChildrenWinWarning("Error", children, { message });
  if (!inside) return null;
  if (children !== undefined) return <>{children}</>;
  if (!state.error) return null;
  return (
    <div className="openui-artifact-error" role="alert">
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
