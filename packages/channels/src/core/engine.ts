/**
 * The render and interaction engine, built on lang-core's parser, state store,
 * evaluator, and action model. Instance-based: createEngine(channel) binds a
 * platform's ChannelLibrary (and optionally a tool provider) and returns pure
 * functions over (source, state):
 *   renderState(source[, state])                         -> output + actionMap + charts + forms + state
 *   applyInteraction(source, state, {actionId?, value?, patch?})
 *     -> same, after applying one normalized interaction: `patch` merges into
 *        $state first, then `actionId`'s plan runs (a button's action, a bound
 *        input set to `value`, or a form's on-submit action by form id)
 *   applyAction / submitForm                             -> sugar over applyInteraction
 *
 * The engine never stores anything and never talks to a transport — the caller
 * posts the output and persists { source, state } per message.
 *
 * Query() calls run against the tool provider before props are resolved, so
 * components can reference live data via ctx.resolveRef.
 */
import type { ActionStep, EvalContext, Store, ToolProvider } from "@openuidev/lang-core";
import { createParser, createStore, evaluate, evaluateElementProps } from "@openuidev/lang-core";
import type { ActionEntry, ChannelLibrary, Interaction, RenderResult, Snapshot } from "./types";
import { walkTree } from "./walker";

export interface Engine<Out> {
  renderState(source: string, state?: Snapshot): Promise<RenderResult<Out>>;
  applyInteraction(
    source: string,
    state: Snapshot,
    interaction?: Interaction,
  ): Promise<RenderResult<Out>>;
  /** Sugar: a button press or control change. */
  applyAction(
    source: string,
    state: Snapshot,
    actionId: string,
    value?: unknown,
  ): Promise<RenderResult<Out>>;
  /** Sugar: a batched form submit (field values + the form's on-submit action). */
  submitForm(
    source: string,
    state: Snapshot,
    formId: string,
    patch: Snapshot,
  ): Promise<RenderResult<Out>>;
}

export function createEngine<Out>(
  channel: ChannelLibrary<Out>,
  opts: { toolProvider?: ToolProvider | null; quiet?: boolean } = {},
): Engine<Out> {
  const { library } = channel;
  // Parser built from the library's JSON schema (maps positional args to named props).
  const parser = createParser(library.toJSONSchema(), library.root ?? "Root");
  const toolProvider = opts.toolProvider ?? null;
  const quiet = opts.quiet ?? false; // e.g. preview engines rendering half-written programs

  /**
   * Build the EvalContext lang-core's evaluator needs. ctx.getState reads a
   * $variable from the store; ctx.resolveRef returns a Query result by its
   * statement id (populated by runQueries).
   */
  function evalContextFor(store: Store, refs: Map<string, unknown>): EvalContext {
    return {
      ctx: {
        getState: (name: string) => store.get(name),
        resolveRef: (name: string) => refs.get(name),
      },
      library,
      store,
    };
  }

  /** Parse openui-lang and log any (non-fatal) component/prop validation errors. */
  function parseChecked(source: string) {
    const parsed = parser.parse(source);
    if (parsed.meta.errors.length && !quiet) {
      console.warn("[openui] parse errors:", JSON.stringify(parsed.meta.errors));
    }
    return parsed;
  }

  /** Call a tool, logging the request and a preview of the result. */
  async function callToolLogged(name: string, args: Record<string, unknown>): Promise<unknown> {
    console.info(`[openui] -> ${name}(${JSON.stringify(args)})`);
    const result = await (toolProvider as ToolProvider).callTool(name, args);
    const preview = JSON.stringify(result);
    console.info(
      `[openui] <- ${name}: ${preview.length > 500 ? preview.slice(0, 500) + "…" : preview}`,
    );
    return result;
  }

  /**
   * Run each Query() against the tool provider, storing results by statement id.
   * Falls back to the query's declared default when there is no provider or the
   * call fails, so the UI still renders.
   */
  async function runQueries(
    parsed: any,
    evalCtx: EvalContext,
    refs: Map<string, unknown>,
  ): Promise<void> {
    for (const q of parsed.queryStatements ?? []) {
      let data: unknown = q.defaultsAST ? evaluate(q.defaultsAST, evalCtx.ctx) : undefined;
      if (toolProvider) {
        try {
          const name = String(evaluate(q.toolAST, evalCtx.ctx));
          const args = (q.argsAST ? evaluate(q.argsAST, evalCtx.ctx) : {}) as Record<
            string,
            unknown
          >;
          data = await callToolLogged(name, args ?? {});
        } catch (e) {
          console.warn(`[openui] query '${q.statementId}' failed:`, e);
        }
      }
      refs.set(q.statementId, data);
    }
  }

  /** Run a Mutation() referenced by @Run, storing { status, data | error } by statement id. */
  async function runMutation(
    parsed: any,
    statementId: string,
    evalCtx: EvalContext,
    refs: Map<string, unknown>,
  ): Promise<void> {
    const m = (parsed.mutationStatements ?? []).find((x: any) => x.statementId === statementId);
    if (!m) return;
    if (!toolProvider) {
      console.warn(`[openui] mutation '${statementId}' skipped: no MCP server connected`);
      refs.set(statementId, { status: "error", error: "no MCP server connected" });
      return;
    }
    try {
      const name = String(evaluate(m.toolAST, evalCtx.ctx));
      const args = (m.argsAST ? evaluate(m.argsAST, evalCtx.ctx) : {}) as Record<string, unknown>;
      const data = await callToolLogged(name, args ?? {});
      refs.set(statementId, { status: "success", data });
    } catch (e: any) {
      console.warn(`[openui] mutation '${statementId}' failed:`, e);
      refs.set(statementId, { status: "error", error: String(e?.message ?? e) });
    }
  }

  /** Run an ActionPlan's steps: @Set / @Reset state and @Run mutations. */
  async function executePlan(
    parsed: any,
    plan: any,
    store: Store,
    evalCtx: EvalContext,
    refs: Map<string, unknown>,
  ): Promise<void> {
    for (const step of (plan?.steps ?? []) as ActionStep[]) {
      if (step.type === "set") {
        store.set(step.target, evaluate(step.valueAST, evalCtx.ctx));
      } else if (step.type === "reset") {
        for (const target of step.targets) store.set(target, parsed.stateDeclarations[target]);
      } else if (step.type === "run" && step.refType === "mutation") {
        await runMutation(parsed, step.statementId, evalCtx, refs);
      }
      // @Run(query) refreshes happen via the caller's post-run runQueries.
    }
  }

  function errorResult(state: Snapshot): RenderResult<Out> {
    return { ...channel.errorMessage(), actionMap: {}, charts: [], forms: {}, state };
  }

  /** Resolve props against the store and walk the tree into platform output. */
  function render(parsed: any, evalCtx: EvalContext, store: Store): RenderResult<Out> {
    const resolved = evaluateElementProps(parsed.root as any, evalCtx);
    const next = store.getSnapshot();
    const w = walkTree(resolved, library, next);
    const fin = channel.finalize(w.items, resolved);
    return {
      output: fin.output,
      text: fin.text,
      actionMap: w.actionMap,
      charts: w.charts,
      forms: w.forms,
      state: next,
    };
  }

  /**
   * Apply one normalized interaction and re-render. `patch` merges into $state
   * before anything runs (batched submits). `actionId` resolves to a button's
   * ActionPlan, a bound input (set to `value`), or - by form id - a form's
   * on-submit action. Queries run before the lookup (to resolve the tree) and
   * again after (state may change a query's args).
   */
  async function applyInteraction(
    source: string,
    state: Snapshot,
    interaction: Interaction = {},
  ): Promise<RenderResult<Out>> {
    const { actionId, value, patch } = interaction;
    const parsed = parseChecked(source);
    const merged = patch ? { ...state, ...patch } : state;
    if (!parsed.root) return errorResult(merged);

    const store = createStore();
    store.initialize(parsed.stateDeclarations, merged);
    const refs = new Map<string, unknown>();
    const evalCtx = evalContextFor(store, refs);
    await runQueries(parsed, evalCtx, refs);

    if (actionId !== undefined) {
      const w = walkTree(
        evaluateElementProps(parsed.root as any, evalCtx),
        library,
        store.getSnapshot(),
      );
      const formAction = w.forms[actionId]?.action;
      const entry: ActionEntry | undefined =
        w.actionMap[actionId] ?? (formAction ? { kind: "action", plan: formAction } : undefined);
      if (entry?.kind === "action") {
        await executePlan(parsed, entry.plan, store, evalCtx, refs);
      } else if (entry?.kind === "input") {
        store.set(entry.target, value);
      }
      await runQueries(parsed, evalCtx, refs);
    }

    return render(parsed, evalCtx, store);
  }

  const renderState = (source: string, state: Snapshot = {}) => applyInteraction(source, state);

  const applyAction = (source: string, state: Snapshot, actionId: string, value?: unknown) =>
    applyInteraction(source, state, { actionId, value });

  const submitForm = (source: string, state: Snapshot, formId: string, patch: Snapshot) =>
    applyInteraction(source, state, { actionId: formId, patch });

  return { renderState, applyInteraction, applyAction, submitForm };
}
