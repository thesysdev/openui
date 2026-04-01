import type { ActionEvent, ElementNode, ParseResult, Transport } from "@openuidev/lang-core";
import React, { Component, Fragment, useEffect, useInsertionEffect, useRef } from "react";
import { OpenUIContext, useOpenUI, useRenderNode } from "./context";
import { useOpenUIState } from "./hooks/useOpenUIState";
import type { ComponentRenderer, Library } from "./library";

export interface RendererProps {
  /** Raw response text (openui-lang code). */
  response: string | null;
  /** Component library from createLibrary(). */
  library: Library;
  /** Whether the LLM is still streaming (form interactions disabled during streaming). */
  isStreaming?: boolean;
  /** Callback when a component triggers an action. */
  onAction?: (event: ActionEvent) => void;
  /**
   * Called whenever a form field value changes. Receives the raw form state map.
   * The consumer decides how to persist this (e.g. embed in message, store separately).
   */
  onStateUpdate?: (state: Record<string, unknown>) => void;
  /**
   * Initial form state to hydrate on load (e.g. from a previously persisted message).
   * Shape: { formName: { fieldName: { value, componentType } }, $varName: value }
   * $-prefixed keys are treated as reactive bindings, everything else is form state.
   */
  initialState?: Record<string, any>;
  /** Called whenever the parse result changes. */
  onParseResult?: (result: ParseResult | null) => void;
  /** Transport for Query() data fetching — MCP, REST, GraphQL, or any backend. */
  transport?: Transport | null;
  /** Custom loading indicator shown while queries are fetching. Defaults to a spinner. */
  queryLoader?: React.ReactNode;
}

// ─── Error boundary ───

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary that intentionally shows the last successfully rendered
 * children when a render error occurs. This "show last good state" behavior
 * prevents the UI from going blank during streaming or transient evaluation
 * errors, and auto-recovers when new valid children arrive.
 */
class ElementErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private lastValidChildren: React.ReactNode = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidMount(): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
    }
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[openui] Component render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.lastValidChildren;
    }
    return this.props.children;
  }
}

// ─── Internal rendering ───

/**
 * Recursively renders a parsed value (element, array, primitive)
 * into React nodes.
 */
function renderDeep(value: unknown): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value.map((v, i) => <Fragment key={i}>{renderDeep(v)}</Fragment>);
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj.type === "element") {
      return <RenderNode node={obj as unknown as ElementNode} />;
    }
  }

  return null;
}

/**
 * Renders a single ElementNode.
 */
function RenderNode({ node }: { node: ElementNode }) {
  const { library } = useOpenUI();
  const Comp = library.components[node.typeName]?.component;

  if (!Comp) return null;

  return (
    <ElementErrorBoundary>
      <RenderNodeInner el={node} Comp={Comp} />
    </ElementErrorBoundary>
  );
}

/**
 * Renders a resolved element using its renderer.
 * Props are already evaluated by evaluate-tree — no AST awareness needed.
 */
function RenderNodeInner({ el, Comp }: { el: ElementNode; Comp: ComponentRenderer<any> }) {
  const renderNode = useRenderNode();
  return <Comp props={el.props} renderNode={renderNode} />;
}

// ─── Loading style injection (once per document) ───

let loadingStyleInjected = false;
function ensureLoadingStyle() {
  if (loadingStyleInjected || typeof document === "undefined") return;
  loadingStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `@keyframes openui-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

// ─── Public component ───

const DefaultQueryLoader = () => (
  <div
    style={{
      position: "absolute",
      top: 8,
      right: 8,
      width: 16,
      height: 16,
      border: "2px solid #e5e7eb",
      borderTopColor: "#3b82f6",
      borderRadius: "50%",
      animation: "openui-spin 0.6s linear infinite",
      zIndex: 10,
    }}
  />
);

export function Renderer({
  response,
  library,
  isStreaming = false,
  onAction,
  onStateUpdate,
  initialState,
  onParseResult,
  transport,
  queryLoader,
}: RendererProps) {
  useInsertionEffect(() => {
    ensureLoadingStyle();
  }, []);

  const onParseResultRef = useRef(onParseResult);
  onParseResultRef.current = onParseResult;

  const { result, parseResult, contextValue, isQueryLoading } = useOpenUIState(
    {
      response,
      library,
      isStreaming,
      onAction,
      onStateUpdate,
      initialState,
      transport,
    },
    renderDeep,
  );

  // Fire onParseResult with the RAW parse result (not evaluated),
  // so hosts only see changes when the parser output actually changes.
  useEffect(() => {
    onParseResultRef.current?.(parseResult);
  }, [parseResult]);

  if (!result?.root) {
    return null;
  }

  return (
    <OpenUIContext.Provider value={contextValue}>
      <div style={{ position: "relative" }}>
        {isQueryLoading && (queryLoader ?? <DefaultQueryLoader />)}
        <div style={{ opacity: isQueryLoading ? 0.7 : 1, transition: "opacity 0.2s ease" }}>
          <RenderNode node={result.root} />
        </div>
      </div>
    </OpenUIContext.Provider>
  );
}
