import { useArtifact, useArtifactPortalTarget } from "@openuidev/react-headless";
import clsx from "clsx";
import { X } from "lucide-react";
import { Component, forwardRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../ThemeProvider/ThemeProvider";

/** @internal */
type ArtifactErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type ArtifactErrorBoundaryState = {
  hasError: boolean;
};

/** @internal */
class ArtifactErrorBoundary extends Component<
  ArtifactErrorBoundaryProps,
  ArtifactErrorBoundaryState
> {
  constructor(props: ArtifactErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ArtifactErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

/**
 * Props for {@link ArtifactPanel}.
 *
 * @category Components
 */
export type ArtifactPanelProps = {
  /** Artifact ID this panel renders content for. Must match the ID passed to `useArtifact(id)`. */
  artifactId: string;
  /** Content rendered inside the panel when this artifact is active. */
  children: ReactNode;
  /** Additional CSS class name(s) applied to the panel container. */
  className?: string;
  /** Fallback UI rendered if children throw during rendering. Defaults to `null`. */
  errorFallback?: ReactNode;
  /**
   * Controls the panel header.
   * - `true` (default): built-in header with title from meta + close button
   * - `false`: no header, raw children only
   * - `ReactNode`: custom header replacing the built-in one
   *
   * Note: closing an artifact deactivates it but preserves its metadata in the store.
   */
  header?: boolean | ReactNode;
};

/** @internal */
const DefaultHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="openui-artifact-panel__header">
    <span className="openui-artifact-panel__title">{title}</span>
    <button
      className="openui-artifact-panel__close"
      onClick={onClose}
      aria-label="Close artifact panel"
    >
      <X size={16} />
    </button>
  </div>
);

/**
 * Portals artifact content into the nearest {@link ArtifactPortalTarget}.
 *
 * Renders nothing when the artifact is inactive or no portal target is mounted.
 * Wraps children in an error boundary and applies theme-scoped class names.
 *
 * Requires `<ArtifactPortalTarget />` to be mounted in the layout.
 *
 * @category Components
 */
export const ArtifactPanel = forwardRef<HTMLDivElement, ArtifactPanelProps>(
  ({ artifactId, children, className, errorFallback, header = true }, ref) => {
    const { isActive, meta, close } = useArtifact(artifactId);
    const { node: panelNode } = useArtifactPortalTarget();
    const { portalThemeClassName } = useTheme();

    useEffect(() => {
      if (!isActive || panelNode) return;

      const timer = setTimeout(() => {
        console.warn(
          "[OpenUI] ArtifactPanel: artifact is active but no render target is mounted. " +
            "Ensure <ArtifactPortalTarget /> is rendered in your layout.",
        );
      }, 100);
      return () => clearTimeout(timer);
    }, [isActive, panelNode]);

    if (!isActive || !panelNode) return null;

    const handleClose = () => close();

    let headerContent: ReactNode = null;
    if (header === true) {
      headerContent = <DefaultHeader title={meta?.title ?? "Artifact"} onClose={handleClose} />;
    } else if (header !== false) {
      headerContent = header;
    }

    return createPortal(
      <div
        ref={ref}
        id={`openui-artifact-panel-${artifactId}`}
        className={clsx("openui-artifact-panel", portalThemeClassName, className)}
        role="region"
        aria-label={meta?.title ?? "Artifact panel"}
      >
        {headerContent}
        <ArtifactErrorBoundary fallback={errorFallback}>{children}</ArtifactErrorBoundary>
      </div>,
      panelNode,
    );
  },
);

ArtifactPanel.displayName = "ArtifactPanel";
