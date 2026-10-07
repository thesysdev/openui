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
  type ToolProvider,
  type ValidationError,
} from "@openuidev/lang-core";
import {
  computed,
  isRef,
  onUnmounted,
  ref,
  shallowRef,
  watchEffect,
  type ComputedRef,
  type Ref,
} from "vue";
import type { OpenUIContextValue } from "./context.js";

/** Unwrap { value, componentType } wrapper from form field entries. Returns raw value. */
function unwrapFieldValue(v: unknown): unknown {
  if (
    v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "value" in (v as Record<string, unknown>)
  ) {
    return (v as Record<string, unknown>)["value"];
  }
  return v;
}

export interface UseOpenUIStateOptions {
  response: Ref<string | null> | string | null;
  library: any;
  isStreaming: Ref<boolean> | boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
  toolProvider?: Ref<ToolProvider | null> | ToolProvider | null;
  onError?: (errors: OpenUIError[]) => void;
}

export interface OpenUIState {
  result: ComputedRef<ParseResult | null>;
  parseResult: ComputedRef<ParseResult | null>;
  contextValue: ComputedRef<OpenUIContextValue>;
  isQueryLoading: ComputedRef<boolean>;
}

export function useOpenUIState(
  options: UseOpenUIStateOptions,
  renderDeep: (value: unknown) => any,
): OpenUIState {
  const responseRef = computed(() => {
    return typeof options.response === "object" &&
      options.response !== null &&
      "value" in options.response
      ? options.response.value
      : options.response;
  });

  const isStreamingRef = computed(() => {
    return typeof options.isStreaming === "object" &&
      options.isStreaming !== null &&
      "value" in options.isStreaming
      ? options.isStreaming.value
      : options.isStreaming;
  });

  const toolProviderRef = computed(() => {
    return isRef(options.toolProvider) ? options.toolProvider.value : options.toolProvider;
  });

  // ─── Streaming parser ───
  const sp = createStreamingParser(options.library.toJSONSchema(), options.library.root);

  // ─── Parse result ───
  const parseException = ref<OpenUIError | null>(null);
  const parseResult = computed<ParseResult | null>(() => {
    parseException.value = null;
    const resp = responseRef.value;
    if (!resp) return null;
    try {
      return sp.set(resp);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      parseException.value = {
        source: "parser",
        code: "parse-exception",
        message: `Parser crashed: ${msg}`,
        hint: "The response may contain syntax the parser cannot handle",
      };
      return null;
    }
  });

  // ─── Store ───
  const store = createStore();

  // ─── QueryManager ───
  const queryManager = shallowRef<QueryManager | null>(null);
  const querySnapshot = shallowRef<QuerySnapshot>({
    __openui_loading: [],
    __openui_refetching: [],
    __openui_errors: [],
  });

  watchEffect((onCleanup) => {
    const provider = toolProviderRef.value;
    const qm = createQueryManager(provider ?? null);
    qm.activate();
    queryManager.value = qm;

    querySnapshot.value = qm.getSnapshot();
    const unsub = qm.subscribe(() => {
      querySnapshot.value = qm.getSnapshot();
    });

    onCleanup(() => {
      unsub();
      qm.dispose();
    });
  });

  onUnmounted(() => {
    store.dispose();
  });

  // ─── Initialize Store ───
  let lastStoreInitKey = "";
  watchEffect(() => {
    const res = parseResult.value;
    const initial = options.initialState;
    if (!res?.stateDeclarations && !initial) return;
    const key = `${JSON.stringify(res?.stateDeclarations)}::${JSON.stringify(initial)}`;
    if (lastStoreInitKey === key) return;
    lastStoreInitKey = key;

    const bindingDefaults: Record<string, unknown> = {};
    if (initial) {
      for (const [k, v] of Object.entries(initial)) {
        if (k.startsWith("$")) {
          bindingDefaults[k] = v;
        } else {
          store.set(k, v);
        }
      }
    }
    store.initialize(res?.stateDeclarations ?? {}, bindingDefaults);
  });

  // ─── Snapshots ───
  const storeSnapshot = shallowRef(store.getSnapshot());

  const unsubStore = store.subscribe(() => {
    storeSnapshot.value = store.getSnapshot();
  });

  onUnmounted(() => {
    unsubStore();
  });

  // ─── Build EvaluationContext ───
  const evaluationContext = computed<EvaluationContext>(() => {
    // Touch snapshots to reactively track changes
    const _store = storeSnapshot.value;
    const qm = queryManager.value;

    return {
      getState: (name: string) => unwrapFieldValue(store.get(name)),
      resolveRef: (name: string) => {
        if (!qm) return null;
        const mutResult = qm.getMutationResult(name);
        if (mutResult) return mutResult;
        return qm.getResult(name);
      },
    };
  });

  // ─── Evaluate and submit queries ───
  watchEffect(() => {
    if (isStreamingRef.value) return;

    // Touch storeSnapshot to re-evaluate when dependencies change
    const _store = storeSnapshot.value;
    const qm = queryManager.value;
    if (!qm) return;

    const queryStmts = parseResult.value?.queryStatements ?? [];
    const evaluatedNodes = queryStmts.map((qn) => {
      const relevantDeps: Record<string, unknown> = {};
      if (qn.deps) {
        for (const refName of qn.deps) {
          relevantDeps[refName] = storeSnapshot.value[refName];
        }
      }
      return {
        statementId: qn.statementId,
        toolName: qn.toolAST ? (evaluate(qn.toolAST, evaluationContext.value) as string) : "",
        args: qn.argsAST ? evaluate(qn.argsAST, evaluationContext.value) : null,
        defaults: qn.defaultsAST ? evaluate(qn.defaultsAST, evaluationContext.value) : null,
        refreshInterval: qn.refreshAST
          ? (evaluate(qn.refreshAST, evaluationContext.value) as number)
          : undefined,
        deps: Object.keys(relevantDeps).length > 0 ? relevantDeps : undefined,
        complete: qn.complete,
      };
    });

    qm.evaluateQueries(evaluatedNodes);
  });

  // ─── Register mutations ───
  watchEffect(() => {
    if (isStreamingRef.value) return;
    const qm = queryManager.value;
    if (!qm) return;

    const mutStmts = parseResult.value?.mutationStatements ?? [];
    const nodes = mutStmts.map((mn) => ({
      statementId: mn.statementId,
      toolName: mn.toolAST ? (evaluate(mn.toolAST, evaluationContext.value) as string) : "",
    }));
    qm.registerMutations(nodes);
  });

  // ─── Fire onStateUpdate when Store changes ───
  let lastStateUpdateSnapshot = store.getSnapshot();
  const unsubStateUpdate = store.subscribe(() => {
    const currentSnapshot = store.getSnapshot();
    if (currentSnapshot === lastStateUpdateSnapshot) return;
    lastStateUpdateSnapshot = currentSnapshot;
    options.onStateUpdate?.(currentSnapshot);
  });
  onUnmounted(() => {
    unsubStateUpdate();
  });

  // ─── getFieldValue ───
  function getFieldValue(formName: string | undefined, name: string): any {
    if (!formName) return unwrapFieldValue(store.get(name));
    const formData = store.get(formName);
    if (!formData || typeof formData !== "object" || Array.isArray(formData)) return undefined;
    return unwrapFieldValue((formData as Record<string, unknown>)[name]);
  }

  // ─── setFieldValue ───
  function setFieldValue(
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: unknown,
    shouldTriggerSaveCallback: boolean = true,
  ): void {
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
      options.onStateUpdate?.(store.getSnapshot());
    }
  }

  // ─── Materialize form payload ───
  function getFormPayload(formName?: string): Record<string, unknown> | undefined {
    if (formName) {
      const raw = store.get(formName);
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return { [formName]: raw };
      }
    }
    return store.getSnapshot();
  }

  // ─── triggerAction ───
  async function triggerAction(
    userMessage: string,
    formName?: string,
    action?: ActionPlan | { type?: string; params?: Record<string, any> },
  ): Promise<void> {
    const formPayload = getFormPayload(formName);
    const qm = queryManager.value;

    // Legacy action config path (v0.1 compat) — { type?, params? }
    if (action && !("steps" in action)) {
      const actionType = action.type || BuiltinActionType.ContinueConversation;
      const params = { ...(action.params || {}) };
      if ((action as any).url) params["url"] = (action as any).url;
      if ((action as any).context) params["context"] = (action as any).context;
      options.onAction?.({
        type: actionType,
        params,
        humanFriendlyMessage: userMessage,
        formState: formPayload,
        formName,
      });
      return;
    }

    // ActionPlan path (v0.5)
    const actionPlan = action as ActionPlan | undefined;
    if (actionPlan?.steps) {
      for (const step of actionPlan.steps) {
        switch (step.type) {
          case ACTION_STEPS.Run: {
            if (step.refType === "mutation") {
              const mn = parseResult.value?.mutationStatements?.find(
                (m) => m.statementId === step.statementId,
              );
              const evaluatedArgs = mn?.argsAST
                ? (evaluate(mn.argsAST, evaluationContext.value) as Record<string, unknown>)
                : {};
              if (!qm) return;
              const ok = await qm.fireMutation(step.statementId, evaluatedArgs);
              if (!ok) return; // halt on failure
            } else {
              if (qm) qm.invalidate([step.statementId]);
            }
            break;
          }
          case ACTION_STEPS.ToAssistant:
            options.onAction?.({
              type: BuiltinActionType.ContinueConversation,
              params: step.context !== undefined ? { context: step.context } : {},
              humanFriendlyMessage: step.message,
              formState: formPayload,
              formName,
            });
            break;
          case ACTION_STEPS.OpenUrl:
            options.onAction?.({
              type: BuiltinActionType.OpenUrl,
              params: { url: step.url },
              humanFriendlyMessage: "",
              formState: formPayload,
              formName,
            });
            break;
          case ACTION_STEPS.Set: {
            if (!step.valueAST) break;
            const value = evaluate(step.valueAST, evaluationContext.value);
            store.set(step.target, value);
            break;
          }
          case ACTION_STEPS.Reset: {
            const decls = parseResult.value?.stateDeclarations ?? {};
            for (const target of step.targets) {
              store.set(target, decls[target] ?? null);
            }
            break;
          }
        }
      }
      return;
    }

    // Default
    options.onAction?.({
      type: BuiltinActionType.ContinueConversation,
      params: {},
      humanFriendlyMessage: userMessage,
      formState: formPayload,
      formName,
    });
  }

  const isQueryLoading = computed(() => querySnapshot.value.__openui_loading.length > 0);

  // ─── Context value ───
  const contextValue = computed<OpenUIContextValue>(() => ({
    library: options.library,
    renderNode: renderDeep,
    triggerAction,
    isStreaming: isStreamingRef as any,
    isQueryLoading: isQueryLoading as any,
    getFieldValue,
    setFieldValue,
    store,
    evaluationContext: evaluationContext.value,
  }));

  // ─── Evaluate props ───
  const runtimeErrors = ref<OpenUIError[]>([]);

  const evaluatedResult = computed<ParseResult | null>(() => {
    const res = parseResult.value;
    if (!res?.root) return res;
    // Touch querySnapshot to re-evaluate props when queries/mutations resolve/fail
    const _query = querySnapshot.value;
    const errors: OpenUIError[] = [];
    const evalCtx: EvalContext = {
      ctx: evaluationContext.value,
      library: options.library,
      store,
      errors,
    };
    try {
      const evaluatedRoot = evaluateElementProps(res.root, evalCtx);
      runtimeErrors.value = errors;
      return { ...res, root: evaluatedRoot };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({
        source: "runtime",
        code: "runtime-error",
        message: `Prop evaluation failed: ${msg}`,
      });
      runtimeErrors.value = errors;
      return res;
    }
  });

  // ─── Collect and fire onError ───
  let lastErrorKey = "";
  watchEffect(() => {
    if (isStreamingRef.value) {
      if (lastErrorKey !== "") {
        lastErrorKey = "";
        options.onError?.([]);
      }
      return;
    }

    const errors: OpenUIError[] = [];

    // Parser exception
    if (parseException.value) {
      errors.push(parseException.value);
    }

    // Parse failure
    const resp = responseRef.value;
    const res = parseResult.value;
    if (resp && !res?.root && !parseException.value) {
      errors.push({
        source: "parser",
        code: "parse-failed",
        message: res
          ? "Code parsed but produced no renderable root component"
          : "Response could not be parsed as valid openui-lang",
        hint: `The entire response must be valid openui-lang code starting with root = ${options.library.root ?? "Root"}(...)`,
      });
    }

    // Parser validation errors → tag source; ValidationError.message is already
    // humanized (signatures/available components/expected types inlined).
    if (res?.meta?.errors?.length) {
      errors.push(
        ...res.meta.errors.map((e: ValidationError) => ({
          source: "parser" as const,
          code: e.code,
          message: e.message,
          component: e.component,
          path: e.path || undefined,
          statementId: e.statementId,
          ...(e.severity && { severity: e.severity }),
        })),
      );
    }

    // Runtime eval errors
    errors.push(...runtimeErrors.value);

    // Query/mutation errors
    errors.push(...(querySnapshot.value.__openui_errors ?? []));

    // Deduplicate
    const key = JSON.stringify(errors);
    if (key === lastErrorKey) return;
    lastErrorKey = key;

    if (options.onError) {
      options.onError(errors);
    } else if (errors.length > 0) {
      for (const e of errors) {
        console.warn(`[openui] ${e.source}/${e.code}: ${e.message}`);
      }
    }
  });

  return { result: evaluatedResult, parseResult, contextValue, isQueryLoading };
}
