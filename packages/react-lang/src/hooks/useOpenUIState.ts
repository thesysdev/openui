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
  type ParseResult,
  type QueryManager,
  type QuerySnapshot,
  type Store,
  type Transport,
} from "@openuidev/lang-core";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { OpenUIContextValue } from "../context";
import type { Library } from "../library";

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
  /** Transport for Query data fetching — MCP, REST, GraphQL, or any backend. */
  transport?: Transport | null;
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
    transport,
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
    () => createQueryManager(transport ?? null),
    [transport],
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
    if (!result?.queryStatements?.length) return;

    const evaluatedNodes = result.queryStatements.map((qn) => {
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

    queryManager.evaluateQueries(evaluatedNodes);
  }, [isStreaming, result?.queryStatements, evaluationContext, queryManager, storeSnapshot]);

  // ─── Register mutations ───
  useEffect(() => {
    if (isStreaming) return;
    if (!result?.mutationStatements?.length) {
      return;
    }
    const nodes = result.mutationStatements.map((mn) => ({
      statementId: mn.statementId,
      toolName: mn.toolAST ? (evaluate(mn.toolAST, evaluationContext) as string) : "",
    }));
    queryManager.registerMutations(nodes);
  }, [isStreaming, result?.mutationStatements, evaluationContext, queryManager]);

  // ─── Ref for stable callbacks ───
  const propsRef = useRef({ onAction, onStateUpdate });
  propsRef.current = { onAction, onStateUpdate };

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
        handler?.({
          type: actionType,
          params: action.params || {},
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
    [queryManager, evaluationContext, getFormPayload],
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
  }, [result, evalContext, storeSnapshot, querySnapshot]);

  const isQueryLoading = querySnapshot.__openui_loading.length > 0;

  return { result: evaluatedResult, parseResult: result, contextValue, isQueryLoading };
}
