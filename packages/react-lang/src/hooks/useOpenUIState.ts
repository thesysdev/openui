import {
  ACTION_STEPS,
  BuiltinActionType,
  createQueryManager,
  createStore,
  createStreamingParser,
  evaluate,
  evaluateElementProps,
  type ActionEvent,
  type ActionPlan,
  type EvalContext,
  type EvaluationContext,
  type OpenUIError,
  type ParseResult,
  type QueryManager,
  type QuerySnapshot,
  type Store,
  type ToolProvider,
} from "@openuidev/lang-core";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { OpenUIContextValue } from "../context";
import type { Library } from "../library";

/** Build a signature hint like "Header(title*, subtitle, icon)" from JSON schema. */
function buildSignatureHint(
  componentName: string,
  schema: { properties?: Record<string, unknown>; required?: string[] } | undefined,
): string | undefined {
  if (!schema?.properties) return undefined;
  const required = new Set(schema.required ?? []);
  const params = Object.keys(schema.properties)
    .map((k) => (required.has(k) ? `${k}*` : k))
    .join(", ");
  return `Signature: ${componentName}(${params}) — * marks required`;
}

/** Unwrap { value, componentType } wrapper from form field entries. Returns raw value. */
function unwrapFieldValue(v: unknown): unknown {
  if (
    v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "value" in (v as Record<string, unknown>)
  ) {
    return (v as Record<string, unknown>).value;
  }
  return v;
}

export interface UseOpenUIStateOptions {
  response: string | null;
  library: Library;
  isStreaming: boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, unknown>) => void;
  initialState?: Record<string, any>;
  /** ToolProvider for Query data fetching — MCP, REST, GraphQL, or any backend. */
  toolProvider?: ToolProvider | null;
  /** Callback for structured, LLM-friendly errors. See OpenUIError type. */
  onError?: (errors: OpenUIError[]) => void;
}

export interface OpenUIState {
  /** Evaluated result (props resolved to concrete values). Used by Renderer. */
  result: ParseResult | null;
  /** Raw parse result (AST nodes in props). Used by onParseResult callback. */
  parseResult: ParseResult | null;
  contextValue: OpenUIContextValue;
  /** Whether any Query is currently fetching data. */
  isQueryLoading: boolean;
}

/**
 * Core state hook — extracts all form state, action handling, parser
 * management, and context assembly out of the Renderer component.
 *
 * Store holds everything: $bindings as top-level keys, form fields nested
 * under formName as plain values.
 */
export function useOpenUIState(
  {
    response,
    library,
    isStreaming,
    onAction,
    onStateUpdate,
    initialState,
    toolProvider,
    onError,
  }: UseOpenUIStateOptions,
  renderDeep: (value: unknown) => React.ReactNode,
): OpenUIState {
  // ─── Streaming parser (incremental — caches completed statements) ───
  const sp = useMemo(() => createStreamingParser(library.toJSONSchema(), library.root), [library]);

  // ─── Parse result ───
  const result = useMemo<ParseResult | null>(() => {
    if (!response) return null;
    try {
      return sp.set(response);
    } catch (e) {
      console.error("[openui] Parse error:", e);
      return null;
    }
  }, [sp, response]);

  // ─── Store (holds everything: $bindings + form fields) ───
  const store = useMemo<Store>(() => createStore(), []);

  // ─── QueryManager ───
  const queryManager = useMemo<QueryManager>(
    () => createQueryManager(toolProvider ?? null),
    [toolProvider],
  );

  useEffect(() => {
    queryManager.activate();
    return () => queryManager.dispose();
  }, [queryManager]);

  // ─── Initialize Store ───
  const storeInitKeyRef = useRef<unknown>(Symbol());
  useEffect(() => {
    if (!result?.stateDeclarations && !initialState) return;
    const key = `${JSON.stringify(result?.stateDeclarations)}::${JSON.stringify(initialState)}`;
    if (storeInitKeyRef.current === key) return;
    storeInitKeyRef.current = key;

    // Split initialState: $-prefixed keys are bindings, everything else is form state
    const bindingDefaults: Record<string, unknown> = {};
    if (initialState) {
      for (const [key, value] of Object.entries(initialState)) {
        if (key.startsWith("$")) {
          bindingDefaults[key] = value;
        } else {
          // Form state — restore as-is (preserves { value, componentType } wrapper)
          store.set(key, value);
        }
      }
    }
    store.initialize(result?.stateDeclarations ?? {}, bindingDefaults);
  }, [result?.stateDeclarations, store, initialState]);

  // ─── Subscribe to Store and QueryManager for re-renders ───
  const storeSnapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const querySnapshot = useSyncExternalStore(
    queryManager.subscribe,
    queryManager.getSnapshot,
    queryManager.getSnapshot,
  ) as QuerySnapshot;

  // ─── Build EvaluationContext ───
  const evaluationContext = useMemo<EvaluationContext>(
    () => ({
      getState: (name: string) => unwrapFieldValue(store.get(name)),
      resolveRef: (name: string) => {
        const mutResult = queryManager.getMutationResult(name);
        if (mutResult) return mutResult;
        return queryManager.getResult(name);
      },
    }),
    [store, queryManager],
  );

  // ─── Evaluate and submit queries ───
  useEffect(() => {
    if (isStreaming) return;

    const queryStmts = result?.queryStatements ?? [];
    const evaluatedNodes = queryStmts.map((qn) => {
      const relevantDeps: Record<string, unknown> = {};
      if (qn.deps) {
        for (const ref of qn.deps) {
          relevantDeps[ref] = storeSnapshot[ref];
        }
      }
      return {
        statementId: qn.statementId,
        toolName: qn.toolAST ? (evaluate(qn.toolAST, evaluationContext) as string) : "",
        args: qn.argsAST ? evaluate(qn.argsAST, evaluationContext) : null,
        defaults: qn.defaultsAST ? evaluate(qn.defaultsAST, evaluationContext) : null,
        refreshInterval: qn.refreshAST
          ? (evaluate(qn.refreshAST, evaluationContext) as number)
          : undefined,
        deps: Object.keys(relevantDeps).length > 0 ? relevantDeps : undefined,
        complete: qn.complete,
      };
    });

    // Always call — empty array clears removed queries and their errors
    queryManager.evaluateQueries(evaluatedNodes);
  }, [isStreaming, result?.queryStatements, evaluationContext, queryManager, storeSnapshot]);

  // ─── Register mutations ───
  useEffect(() => {
    if (isStreaming) return;

    const mutStmts = result?.mutationStatements ?? [];
    const nodes = mutStmts.map((mn) => ({
      statementId: mn.statementId,
      toolName: mn.toolAST ? (evaluate(mn.toolAST, evaluationContext) as string) : "",
    }));
    // Always call — empty array clears removed mutations and their errors
    queryManager.registerMutations(nodes);
  }, [isStreaming, result?.mutationStatements, evaluationContext, queryManager]);

  // ─── Ref for stable callbacks ───
  const propsRef = useRef({ onAction, onStateUpdate, onError });
  propsRef.current = { onAction, onStateUpdate, onError };

  const resultRef = useRef(result);
  resultRef.current = result;

  // ─── Fire onStateUpdate when Store changes ───
  const lastInitSnapshotRef = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    lastInitSnapshotRef.current = store.getSnapshot();
    const unsub = store.subscribe(() => {
      const currentSnapshot = store.getSnapshot();
      if (currentSnapshot === lastInitSnapshotRef.current) return;
      lastInitSnapshotRef.current = null;
      propsRef.current.onStateUpdate?.(currentSnapshot);
    });
    return unsub;
  }, [store]);

  // ─── getFieldValue ───
  const getFieldValue = useCallback(
    (formName: string | undefined, name: string) => {
      if (!formName) return unwrapFieldValue(store.get(name));
      const formData = store.get(formName);
      if (!formData || typeof formData !== "object" || Array.isArray(formData)) return undefined;
      return unwrapFieldValue((formData as Record<string, unknown>)[name]);
    },
    [store],
  );

  // ─── setFieldValue ───
  const setFieldValue = useCallback(
    (
      formName: string | undefined,
      componentType: string | undefined,
      name: string,
      value: unknown,
      shouldTriggerSaveCallback: boolean = true,
    ) => {
      const wrapped = { value, componentType };
      if (!formName) {
        store.set(name, wrapped);
      } else {
        const raw = store.get(formName);
        const formData =
          raw && typeof raw === "object" && !Array.isArray(raw)
            ? (raw as Record<string, unknown>)
            : {};
        store.set(formName, { ...formData, [name]: wrapped });
      }
      if (shouldTriggerSaveCallback) {
        propsRef.current.onStateUpdate?.(store.getSnapshot());
      }
    },
    [store],
  );

  // ─── Materialize form payload ───
  const getFormPayload = useCallback(
    (formName?: string): Record<string, unknown> | undefined => {
      if (formName) {
        const raw = store.get(formName);
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          return { [formName]: raw };
        }
      }
      return store.getSnapshot();
    },
    [store],
  );

  // ─── triggerAction ───
  const triggerAction = useCallback(
    async (
      userMessage: string,
      formName?: string,
      action?: ActionPlan | { type?: string; params?: Record<string, any> },
    ) => {
      const formPayload = getFormPayload(formName);
      const { onAction: handler } = propsRef.current;

      // Legacy action config path (v0.4 compat) — { type?, params? }
      if (action && !("steps" in action)) {
        const actionType = action.type || BuiltinActionType.ContinueConversation;
        const params = { ...(action.params || {}) };
        // v0.4 compat — url and context were top-level, not in params
        if ((action as any).url) params.url = (action as any).url;
        if ((action as any).context) params.context = (action as any).context;
        handler?.({
          type: actionType,
          params,
          humanFriendlyMessage: userMessage,
          formState: formPayload,
          formName,
        });
        return;
      }

      // ActionPlan path (v0.5) — sequential steps with halt-on-mutation-failure
      const actionPlan = action as ActionPlan | undefined;
      if (actionPlan?.steps) {
        for (const step of actionPlan.steps) {
          switch (step.type) {
            case ACTION_STEPS.Run: {
              if (step.refType === "mutation") {
                const mn = resultRef.current?.mutationStatements?.find(
                  (m) => m.statementId === step.statementId,
                );
                const evaluatedArgs = mn?.argsAST
                  ? (evaluate(mn.argsAST, evaluationContext) as Record<string, unknown>)
                  : {};
                const ok = await queryManager.fireMutation(step.statementId, evaluatedArgs);
                if (!ok) return; // halt on failure
              } else {
                queryManager.invalidate([step.statementId]);
              }
              break;
            }
            case ACTION_STEPS.ToAssistant:
              handler?.({
                type: BuiltinActionType.ContinueConversation,
                params: step.context ? { context: step.context } : {},
                humanFriendlyMessage: step.message,
                formState: formPayload,
                formName,
              });
              break;
            case ACTION_STEPS.OpenUrl:
              handler?.({
                type: BuiltinActionType.OpenUrl,
                params: { url: step.url },
                humanFriendlyMessage: "",
                formState: formPayload,
                formName,
              });
              break;
            case ACTION_STEPS.Set: {
              if (!step.valueAST) {
                console.warn(`[openui] Set action for ${step.target} has no valueAST — skipping`);
                break;
              }
              const value = evaluate(step.valueAST, evaluationContext);
              store.set(step.target, value);
              break;
            }
            case ACTION_STEPS.Reset: {
              const decls = resultRef.current?.stateDeclarations ?? {};
              for (const target of step.targets) {
                store.set(target, decls[target] ?? null);
              }
              break;
            }
          }
        }
        return;
      }

      // Default — ContinueConversation with label
      handler?.({
        type: BuiltinActionType.ContinueConversation,
        params: {},
        humanFriendlyMessage: userMessage,
        formState: formPayload,
        formName,
      });
    },
    [queryManager, evaluationContext, getFormPayload, store],
  );

  // ─── Context value ───
  const contextValue = useMemo<OpenUIContextValue>(
    () => ({
      library,
      renderNode: renderDeep,
      triggerAction,
      isStreaming,
      getFieldValue,
      setFieldValue,
      store,
      evaluationContext,
    }),
    [
      library,
      renderDeep,
      isStreaming,
      triggerAction,
      getFieldValue,
      setFieldValue,
      store,
      evaluationContext,
    ],
  );

  // ─── Evaluate props ───
  const evalContext = useMemo<EvalContext>(
    () => ({
      ctx: evaluationContext,
      library,
      store,
    }),
    [evaluationContext, library, store],
  );

  const evaluatedResult = useMemo<ParseResult | null>(() => {
    if (!result?.root) return result;
    try {
      const evaluatedRoot = evaluateElementProps(result.root, evalContext);
      return { ...result, root: evaluatedRoot };
    } catch (e) {
      console.error("[openui] Prop evaluation error:", e);
      return result;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- storeSnapshot/querySnapshot are reactive triggers
  }, [result, evalContext, storeSnapshot, querySnapshot]);

  const isQueryLoading = querySnapshot.__openui_loading.length > 0;

  // ─── Collect and fire onError ───
  const lastErrorKeyRef = useRef<string>("");
  useEffect(() => {
    if (isStreaming) {
      // Clear stale errors from previous session so the correction loop
      // gets a clean signal when this streaming session completes.
      if (lastErrorKeyRef.current !== "") {
        lastErrorKeyRef.current = "";
        propsRef.current.onError?.([]);
      }
      return;
    }
    const errors: OpenUIError[] = [];

    // Parse failure — response exists but produced no renderable root
    if (response && !result?.root) {
      errors.push({
        source: "parser",
        code: "parse-failed",
        message: result
          ? "Code parsed but produced no renderable root component"
          : "Response could not be parsed as valid openui-lang",
        hint: "The entire response must be valid openui-lang code starting with root = RootComponent(...)",
      });
    }

    // Parser validation errors → OpenUIError
    if (result?.meta.validationErrors.length) {
      const componentNames = Object.keys(library.components);
      const jsonSchema = library.toJSONSchema();
      for (const ve of result.meta.validationErrors) {
        const error: OpenUIError = {
          source: "parser",
          code: ve.code,
          message: ve.message,
          component: ve.component,
          path: ve.path || undefined,
          statementId: ve.statementId,
        };
        // Enrich with hints based on error code
        if (ve.code === "unknown-component" && componentNames.length) {
          error.hint = `Available components: ${componentNames.join(", ")}`;
        } else if (ve.code === "missing-required" || ve.code === "null-required") {
          error.hint = buildSignatureHint(ve.component, jsonSchema.$defs?.[ve.component]);
        } else if (ve.code === "inline-reserved") {
          error.hint = `Declare as a top-level statement: myVar = ${ve.component}(...)`;
        }
        errors.push(error);
      }
    }

    // Query/mutation tool errors
    const qErrors = querySnapshot.__openui_errors ?? [];
    for (const qe of qErrors) {
      errors.push({
        source: qe.source,
        code: qe.code,
        message: qe.message,
        statementId: qe.statementId,
        component: qe.source === "query" ? "Query" : "Mutation",
        hint: qe.hint,
      });
    }

    // Deduplicate — only fire when errors actually change
    const key = JSON.stringify(errors);
    if (key === lastErrorKeyRef.current) return;
    lastErrorKeyRef.current = key;

    propsRef.current.onError?.(errors);
  }, [isStreaming, response, result, querySnapshot, library]);

  return { result: evaluatedResult, parseResult: result, contextValue, isQueryLoading };
}
