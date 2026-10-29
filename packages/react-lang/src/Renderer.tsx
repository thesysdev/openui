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
  useMemo,
  useRef,
} from "react";
import { Button, Spinner, View, type ButtonProps, type ViewProps } from "./components";
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
  /**
   * What the children were rendered from (the evaluated element). A failed
   * render is always retried when this changes.
   */
  resetKey: unknown;
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
 * errors, and auto-recovers:
 *
 * - whenever the element it renders changes (new streamed props, store or
 *   query data), and
 * - on a parent re-render, so a cause outside openui (a host context becoming
 *   ready) still clears. The first such retry is immediate; after each failed
 *   one the next waits twice as long (up to {@link RETRY_MAX_MS}), and a
 *   parent render during the wait retries once the wait is over.
 *
 * `children` is a new element on every parent render, so retrying on every
 * change of it re-rendered a broken component each time anything above it
 * re-rendered, without end when something kept re-rendering (or when the host
 * re-rendered because of the error itself).
 */
const RETRY_BASE_MS = 50;
const RETRY_MAX_MS = 5000;

class ElementErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private lastValidChildren: React.ReactNode = null;
  /** Wait before the next parent-render retry; 0 until a retry has failed. */
  private retryDelay = 0;
  /** Earliest time (ms) a parent render may retry the failed render. */
  private retryAt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;

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

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState): void {
    if (!this.state.hasError) {
      this.lastValidChildren = this.props.children;
      this.resetRetries();
      return;
    }
    // This update is the failure itself: the new props were just tried.
    if (!prevState.hasError) return;
    if (prevProps.resetKey !== this.props.resetKey) {
      this.resetRetries();
      this.setState({ hasError: false });
    } else if (prevProps.children !== this.props.children) {
      this.retryWhenDue();
    }
  }

  componentWillUnmount(): void {
    clearTimeout(this.retryTimer);
  }

  private resetRetries(): void {
    clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
    this.retryDelay = 0;
    this.retryAt = 0;
  }

  private retryWhenDue(): void {
    if (this.retryTimer !== undefined) return;
    const wait = this.retryAt - Date.now();
    if (wait <= 0) {
      this.setState({ hasError: false });
      return;
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      this.setState({ hasError: false });
    }, wait);
  }

  componentDidCatch(error: Error): void {
    this.retryAt = Date.now() + this.retryDelay;
    this.retryDelay = Math.min(Math.max(this.retryDelay * 2, RETRY_BASE_MS), RETRY_MAX_MS);
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
    <ElementErrorBoundary resetKey={node} componentName={node.typeName} onError={reportError}>
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

// ─── Public component ───

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
  // Fields read the form store during render, so propagate every Renderer update to the slots.
  const value = { root: result?.root ?? null, query, queryLoader };

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

export type RendererContentSlotProps = Omit<ViewProps, "children" | "dimmed">;

/** Displays generated content, preserving mounted components while queries load or fail. */
function RendererContent({ hidden, ...props }: RendererContentSlotProps) {
  const { root, query } = useRendererContext();
  if (!root) return null;
  return (
    <View
      {...props}
      aria-busy={query.isLoading}
      hidden={hidden || query.errors.length > 0}
      dimmed={query.isLoading}
    >
      <RenderNode node={root} />
    </View>
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
  return <>{children === undefined ? (queryLoader ?? <Spinner />) : children}</>;
}

/** Shows the supplied content when queries fail; renders nothing without children. */
function RendererQueryError({ children }: RendererSlotProps) {
  const { errors } = useRendererQuery();
  if (errors.length === 0) return null;
  return <>{children}</>;
}

export type RendererRetryProps = ButtonProps;

function RendererRetry({ disabled, ...props }: RendererRetryProps) {
  const { retry, isLoading, errors } = useRendererQuery();
  return (
    <Button {...props} disabled={disabled || isLoading || errors.length === 0} onActivate={retry} />
  );
}

function DefaultRendererContent() {
  const { root, query, queryLoader } = useRendererContext();
  if (!root) return null;
  return (
    <View aria-busy={query.isLoading} style={{ position: "relative" }}>
      {query.isLoading && (queryLoader ?? <Spinner />)}
      <View dimmed={query.isLoading}>
        <RenderNode node={root} />
      </View>
    </View>
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
