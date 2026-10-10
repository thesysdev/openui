import type {
  ActionEvent,
  ElementNode,
  LibraryActionEvent,
  McpClientLike,
  OpenUIError,
  ParseResult,
  ToolProvider,
} from "@openuidev/lang-core";
import { ToolNotFoundError, extractToolResult } from "@openuidev/lang-core";
import React, {
  Component,
  Fragment,
  createContext,
  useContext,
  useEffect,
  useInsertionEffect,
  useMemo,
  useRef,
} from "react";
import { OpenUIContext, useOpenUI, useRenderNode } from "./context";
import { useOpenUIState } from "./hooks/useOpenUIState";
import type { ComponentRenderer, Library } from "./library";

export interface RendererQueryState {
  /** Whether any query is waiting for generation or fetching data. */
  isLoading: boolean;
  errors: OpenUIError[];
  retry: () => void;
  isRetrying: boolean;
}

export interface RendererProps<L extends Library = Library> {
  /** Raw response: openui-lang code, or a stored message with protocol markers (see buildMessage). */
  response: string | null;
  /** Component library from createLibrary(). */
  library: L;
  /** Whether the LLM is still streaming (form interactions disabled during streaming). */
  isStreaming?: boolean;
  /** Callback when a component triggers an action. Typed by the library's custom actions. */
  onAction?: (event: LibraryActionEvent<L>) => void;
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
  /**
   * Tool provider for Query()/Mutation() calls.
   * - Function map: `{ tool_name: async (args) => result }` — simplest option
   * - MCP client: any object with `callTool({ name, arguments })` (e.g. from @modelcontextprotocol/sdk)
   */
  toolProvider?:
    Record<string, (args: Record<string, unknown>) => Promise<unknown>> | McpClientLike | null;
  /** Custom loading indicator. Defaults to a spinner. */
  queryLoader?: React.ReactNode;
  /** Custom slot composition. Omit to keep content visible with a loading indicator. */
  children?: React.ReactNode;
  /**
   * Called with structured, LLM-friendly errors from the parser and query system.
   * Includes generation errors (unknown components, missing required props)
   * and tool execution failures. Retry data-source failures instead of treating
   * every query error as a reason to regenerate the program.
   * Can include warnings (`severity: "warning"`) for programs that still render.
   * Called with [] when all errors are resolved.
   */
  onError?: (errors: OpenUIError[]) => void;
  publishObservability?: boolean;
}

// ─── Error boundary ───

interface ErrorBoundaryProps {
  children: React.ReactNode;
  componentName?: string;
  onError?: (error: OpenUIError) => void;
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

  componentDidCatch(error: Error): void {
    const name = this.props.componentName ?? "Unknown";
    this.props.onError?.({
      source: "runtime",
      code: "render-error",
      component: name,
      message: `Component ${name} render failed: ${error.message}`,
    });
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
  const { library, reportError } = useOpenUI();
  const Comp = library.components[node.typeName]?.component;

  if (!Comp) return null;

  return (
    <ElementErrorBoundary componentName={node.typeName} onError={reportError}>
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
  return <Comp props={el.props} renderNode={renderNode} statementId={el.statementId} />;
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
    role="status"
    aria-label="Loading data"
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

function RendererRoot<L extends Library = Library>({
  response,
  library,
  isStreaming = false,
  onAction,
  onStateUpdate,
  initialState,
  onParseResult,
  toolProvider,
  queryLoader,
  children,
  onError,
  publishObservability,
}: RendererProps<L>) {
  useInsertionEffect(() => {
    ensureLoadingStyle();
  }, []);

  const onParseResultRef = useRef(onParseResult);
  onParseResultRef.current = onParseResult;

  // Stable ToolProvider wrapper — identity never changes, so QueryManager
  // is created once. callTool() reads the latest input from a ref on every
  // call, so function map updates, closure changes, and provider swaps
  // are always observed without triggering re-creation.
  const toolProviderInputRef = useRef(toolProvider);
  toolProviderInputRef.current = toolProvider;

  const stableToolProvider = useRef<ToolProvider>({
    async callTool(toolName: string, args: Record<string, unknown>): Promise<unknown> {
      const current = toolProviderInputRef.current ?? null;
      if (current == null) throw new Error("[openui] toolProvider is null");
      // MCP client — has callTool({ name, arguments }) returning MCP envelope
      if (typeof (current as McpClientLike).callTool === "function") {
        const result = await (current as McpClientLike).callTool({
          name: toolName,
          arguments: args,
        });
        return extractToolResult(result);
      }
      // Function map — plain object of async functions
      const map = current as Record<string, (a: Record<string, unknown>) => Promise<unknown>>;
      const fn = map[toolName];
      if (!fn) throw new ToolNotFoundError(toolName, Object.keys(map));
      return fn(args);
    },
  });
  const resolvedToolProvider = toolProvider != null ? stableToolProvider.current : null;

  const { result, parseResult, contextValue, isQueryLoading, queryErrors, retryQueries } =
    useOpenUIState(
      {
        response,
        library,
        isStreaming,
        // The hook builds plain ActionEvents; LibraryActionEvent<L> is the same shape, narrowed.
        onAction: onAction as ((event: ActionEvent) => void) | undefined,
        onStateUpdate,
        initialState,
        toolProvider: resolvedToolProvider,
        onError,
        publishObservability,
      },
      renderDeep,
    );

  // Fire onParseResult with the RAW parse result (not evaluated),
  // so hosts only see changes when the parser output actually changes.
  useEffect(() => {
    onParseResultRef.current?.(parseResult);
  }, [parseResult]);

  const query = useMemo<RendererQueryState>(
    () => ({
      isLoading: isQueryLoading,
      errors: queryErrors,
      retry: retryQueries,
      isRetrying: queryErrors.length > 0 && isQueryLoading,
    }),
    [isQueryLoading, queryErrors, retryQueries],
  );
  // Keyed on the evaluated result, not its root: a static tree keeps the same root
  // when form state changes, and fields read their values while rendering.
  const value = useMemo(
    () => ({ root: result?.root ?? null, query, queryLoader }),
    [result, query, queryLoader],
  );

  return (
    <OpenUIContext.Provider value={contextValue}>
      <RendererContext.Provider value={value}>{children}</RendererContext.Provider>
    </OpenUIContext.Provider>
  );
}

const RendererContext = createContext<{
  root: ElementNode | null;
  query: RendererQueryState;
  queryLoader?: React.ReactNode;
} | null>(null);

function useRendererContext() {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error("Renderer slots must be used within Renderer.Root or Renderer.");
  }
  return context;
}

/** Access query loading, failures, and retry within the nearest Renderer root. */
export function useRendererQuery(): RendererQueryState {
  return useRendererContext().query;
}

export type RendererContentSlotProps = Omit<React.ComponentPropsWithRef<"div">, "children">;

/** Displays generated content, preserving mounted components while queries load or fail. */
function RendererContent({ style, hidden, ...props }: RendererContentSlotProps) {
  const { root, query } = useRendererContext();
  if (!root) return null;
  return (
    <div
      {...props}
      aria-busy={query.isLoading}
      hidden={hidden || query.errors.length > 0}
      style={{ opacity: query.isLoading ? 0.7 : 1, transition: "opacity 0.2s ease", ...style }}
    >
      <RenderNode node={root} />
    </div>
  );
}

export interface RendererSlotProps {
  children?: React.ReactNode;
}

/** Shows query loading feedback, except while a query failure is being displayed. */
function RendererQueryLoading({ children }: RendererSlotProps) {
  const {
    query: { isLoading, errors },
    queryLoader,
  } = useRendererContext();
  if (!isLoading || errors.length > 0) return null;
  return <>{children === undefined ? (queryLoader ?? <DefaultQueryLoader />) : children}</>;
}

/** Shows the supplied content when queries fail; renders nothing without children. */
function RendererQueryError({ children }: RendererSlotProps) {
  const { errors } = useRendererQuery();
  if (errors.length === 0) return null;
  return <>{children}</>;
}

export type RendererRetryProps = React.ComponentPropsWithRef<"button">;

function RendererRetry({ children, onClick, disabled, ...props }: RendererRetryProps) {
  const { retry, isLoading, errors } = useRendererQuery();
  const isDisabled = disabled || isLoading || errors.length === 0;
  return (
    <button
      type="button"
      {...props}
      disabled={isDisabled}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled || event.defaultPrevented) return;
        onClick?.(event);
        if (!event.defaultPrevented) retry();
      }}
    >
      {children}
    </button>
  );
}

function DefaultRendererContent() {
  const { root, query, queryLoader } = useRendererContext();
  if (!root) return null;
  return (
    <div aria-busy={query.isLoading} style={{ position: "relative" }}>
      {query.isLoading && (queryLoader ?? <DefaultQueryLoader />)}
      <div style={{ opacity: query.isLoading ? 0.7 : 1, transition: "opacity 0.2s ease" }}>
        <RenderNode node={root} />
      </div>
    </div>
  );
}

function DefaultRenderer<L extends Library = Library>({ children, ...props }: RendererProps<L>) {
  return (
    <RendererRoot {...props}>
      {children === undefined ? <DefaultRendererContent /> : children}
    </RendererRoot>
  );
}

/** Render with the default presentation, or compose slots around one shared runtime. */
export const Renderer = Object.assign(DefaultRenderer, {
  Root: RendererRoot,
  Content: RendererContent,
  QueryLoading: RendererQueryLoading,
  QueryError: RendererQueryError,
  Retry: RendererRetry,
});
