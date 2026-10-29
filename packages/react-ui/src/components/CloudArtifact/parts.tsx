"use client";

import clsx from "clsx";
import { LoaderCircle, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useArtifactRenderer } from "./contexts";

/* The renderer's built-in parts: the preview card, the chrome around the open artifact, and its content. */

const Spinner = () => <LoaderCircle className="openui-artifact-spinner" size={14} aria-hidden />;

const loadingLabel = (isStreaming: boolean) => (isStreaming ? "Generating…" : "Loading data…");

function Loader() {
  const state = useArtifactRenderer();
  if (!state.isLoading) return null;
  return (
    <span className="openui-artifact-loader" role="status">
      <Spinner />
      {loadingLabel(state.isStreaming)}
    </span>
  );
}

/** The card in the chat that opens the artifact. */
export function Preview() {
  const state = useArtifactRenderer();
  return (
    <button
      type="button"
      className="openui-artifact-preview"
      onClick={state.isOpen ? state.close : state.open}
      aria-expanded={state.isOpen}
    >
      <span className="openui-artifact-preview-text">
        <span className="openui-artifact-preview-title">{state.title ?? "Untitled artifact"}</span>
      </span>
      <Loader />
    </button>
  );
}

/** The frame around the open artifact: a bar with its title, loader, your actions and a close button. */
export function Chrome({ actions, children }: { actions?: ReactNode; children: ReactNode }) {
  const state = useArtifactRenderer();
  return (
    <div className="openui-artifact-chrome">
      <div className="openui-artifact-chrome-bar">
        <span className="openui-artifact-chrome-title">{state.title ?? "Untitled artifact"}</span>
        <Loader />
        <div className="openui-artifact-chrome-actions">
          {actions}
          <IconButton
            className="openui-artifact-close"
            variant="tertiary"
            size="small"
            icon={<X size={16} />}
            aria-label="Close"
            onClick={state.close}
          />
        </div>
      </div>
      {children}
    </div>
  );
}

/** The artifact itself, with a loader over it while it loads and a message if it fails. */
export function Content({ isEmpty, children }: { isEmpty: boolean; children: ReactNode }) {
  const state = useArtifactRenderer();
  return (
    <div className="openui-artifact-content">
      {children}
      {state.isLoading && !state.error && (
        <div
          className={clsx("openui-artifact-loading", isEmpty && "openui-artifact-loading-empty")}
          role="status"
        >
          <Spinner />
          {loadingLabel(state.isStreaming)}
        </div>
      )}
      {state.error && (
        <div className="openui-artifact-error" role="alert">
          <span>{state.error.message}</span>
          {state.retry && (
            <Button variant="secondary" size="small" onClick={state.retry}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
