import { NgComponentOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  Type,
} from "@angular/core";
import {
  BuiltinActionType,
  createQueryManager,
  createStore,
  createStreamingParser,
  evaluate,
  evaluateElementProps,
  extractToolResult,
  ToolNotFoundError,
  type ActionEvent,
  type ActionPlan,
  type EvaluationContext,
  type McpClientLike,
  type OpenUIError,
  type ParseResult,
  type QueryManager,
  type QuerySnapshot,
  type Store,
  type StreamParser,
  type ToolProvider,
  type ValidationError,
} from "@openuidev/lang-core";
import type { ActionConfig, OpenUiContextValue } from "./context";
import type { Library } from "./library";
import { OpenUiRenderNodeComponent } from "./render-node.component";
import type { OpenUiToolProvider } from "./types";

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

function isActionPlan(action: ActionPlan | ActionConfig | undefined): action is ActionPlan {
  return !!action && typeof action === "object" && "steps" in action;
}

@Component({
  selector: "openui-renderer",
  standalone: true,
  imports: [NgComponentOutlet, OpenUiRenderNodeComponent],
  template: `
    <div class="openui-renderer-shell">
      @if (context.isQueryLoading) {
        <div class="openui-query-loader" aria-live="polite">
          @if (queryLoader) {
            <ng-container *ngComponentOutlet="queryLoader" />
          } @else {
            <div class="openui-default-loader" aria-label="Loading query results"></div>
          }
        </div>
      }

      <div class="openui-renderer-content" [class.openui-renderer-loading]="context.isQueryLoading">
        @if (rootNode) {
          <openui-render-node [value]="rootNode" [library]="library" [context]="context" />
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .openui-renderer-shell {
        position: relative;
      }

      .openui-query-loader {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 1;
      }

      .openui-renderer-content {
        transition: opacity 0.2s ease;
      }

      .openui-renderer-content.openui-renderer-loading {
        opacity: 0.7;
      }

      .openui-default-loader {
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: openui-spin 0.6s linear infinite;
      }

      @keyframes openui-spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenUiRendererComponent implements OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() response: string | null = null;
  @Input() library: Library | null = null;
  @Input() isStreaming = false;
  @Input() initialState: Record<string, unknown> | undefined = undefined;
  @Input() toolProvider: OpenUiToolProvider = null;
  @Input() queryLoader: Type<unknown> | null = null;

  @Output() readonly action = new EventEmitter<ActionEvent>();
  @Output() readonly stateUpdate = new EventEmitter<Record<string, unknown>>();
  @Output() readonly parseResult = new EventEmitter<ParseResult | null>();
  @Output() readonly error = new EventEmitter<OpenUIError[]>();

  rootNode: unknown = null;

  private parser: StreamParser | null = null;
  private parserLibraryId: string | null = null;
  private lastStoreInitKey: string | null = null;
  private latestParseResult: ParseResult | null = null;
  private latestRuntimeErrors: OpenUIError[] = [];
  private readonly store: Store = createStore();
  private currentToolProviderInput: OpenUiToolProvider = null;
  private readonly stableToolProvider: ToolProvider = {
    callTool: async (toolName: string, args: Record<string, unknown>): Promise<unknown> => {
      const current = this.currentToolProviderInput ?? null;

      if (current == null) {
        throw new Error("[openui] toolProvider is null");
      }

      if (typeof (current as McpClientLike).callTool === "function") {
        const result = await (current as McpClientLike).callTool({
          name: toolName,
          arguments: args,
        });
        return extractToolResult(result);
      }

      const map = current as Record<string, (a: Record<string, unknown>) => Promise<unknown>>;
      const fn = map[toolName];
      if (!fn) {
        throw new ToolNotFoundError(toolName, Object.keys(map));
      }
      return await fn(args);
    },
  };
  private readonly queryManager: QueryManager = createQueryManager(this.stableToolProvider);
  private querySnapshot: QuerySnapshot = this.queryManager.getSnapshot();
  private unsubscribeStore: (() => void) | null = null;
  private unsubscribeQueryManager: (() => void) | null = null;
  private readonly renderErrors = new Map<string, OpenUIError>();

  private readonly evaluationContext: EvaluationContext = {
    getState: (name: string) => unwrapFieldValue(this.store.get(name)),
    resolveRef: (name: string) => {
      const mutation = this.queryManager.getMutationResult(name);
      if (mutation) return mutation;
      return this.queryManager.getResult(name);
    },
  };

  readonly context: OpenUiContextValue = {
    library: null,
    isStreaming: false,
    renderNode: (value) => value,
    triggerAction: (userMessage, formName, action) =>
      this.triggerAction(userMessage, formName, action),
    getFieldValue: (formName, name) => this.getFieldValue(formName, name),
    setFieldValue: (formName, componentType, name, value, shouldTriggerSaveCallback = true) =>
      this.setFieldValue(formName, componentType, name, value, shouldTriggerSaveCallback),
    store: this.store,
    evaluationContext: this.evaluationContext,
    isQueryLoading: false,
    reportParseResult: (result) => this.parseResult.emit(result),
    reportErrors: (errors) => this.error.emit(errors),
    reportError: (error) => {
      this.recordRenderError(error);
      this.cdr.markForCheck();
    },
    clearError: (component, statementId) => {
      this.clearRenderError(component, statementId);
      this.cdr.markForCheck();
    },
  };

  constructor() {
    this.queryManager.activate();
    this.attachQueryManagerSubscription();
    this.unsubscribeStore = this.store.subscribe(() => {
      if (!this.latestParseResult || !this.library) return;
      this.evaluateQueryAndMutationNodes();
      this.refreshEvaluatedState();
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.context.library = this.library;
    this.context.isStreaming = this.isStreaming;
    this.updateToolProviderIfNeeded();

    if (!this.library || !this.response) {
      this.latestParseResult = null;
      this.latestRuntimeErrors = [];
      this.renderErrors.clear();
      this.queryManager.evaluateQueries([]);
      this.queryManager.registerMutations([]);
      this.querySnapshot = this.queryManager.getSnapshot();
      this.context.isQueryLoading = false;
      this.rootNode = null;
      this.parseResult.emit(null);
      this.error.emit([]);
      this.cdr.markForCheck();
      return;
    }

    this.ensureParser(this.library);

    try {
      const parseResult = this.parser?.set(this.response) ?? null;
      this.latestParseResult = parseResult;
      this.initializeStore(parseResult);
      this.evaluateQueryAndMutationNodes();
      this.parseResult.emit(parseResult);
      this.refreshEvaluatedState();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.latestParseResult = null;
      this.latestRuntimeErrors = [];
      this.renderErrors.clear();
      this.rootNode = null;
      this.queryManager.evaluateQueries([]);
      this.queryManager.registerMutations([]);
      this.querySnapshot = this.queryManager.getSnapshot();
      this.context.isQueryLoading = false;
      this.parseResult.emit(null);
      this.error.emit([
        {
          source: "parser",
          code: "parse-exception",
          message: `Parser crashed: ${message}`,
          hint: "The response may contain syntax the parser cannot handle.",
        },
      ]);
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeStore?.();
    this.unsubscribeQueryManager?.();
    this.queryManager.dispose();
    this.store.dispose();
  }

  private updateToolProviderIfNeeded(): void {
    if (this.currentToolProviderInput === this.toolProvider) {
      return;
    }

    this.currentToolProviderInput = this.toolProvider;
    this.queryManager.invalidate();
    this.querySnapshot = this.queryManager.getSnapshot();
    this.context.isQueryLoading = this.querySnapshot.__openui_loading.length > 0;
  }

  private attachQueryManagerSubscription(): void {
    this.unsubscribeQueryManager = this.queryManager.subscribe(() => {
      this.querySnapshot = this.queryManager.getSnapshot();
      this.context.isQueryLoading = this.querySnapshot.__openui_loading.length > 0;
      this.refreshEvaluatedState();
    });
  }

  private ensureParser(library: Library): void {
    if (this.parser && this.parserLibraryId === library.__libraryId) {
      return;
    }

    this.parser = createStreamingParser(library.toJSONSchema(), library.root);
    this.parserLibraryId = library.__libraryId;
  }

  private initializeStore(parseResult: ParseResult | null): void {
    const defaults = parseResult?.stateDeclarations ?? {};
    const key = `${JSON.stringify(defaults)}::${JSON.stringify(this.initialState ?? {})}`;
    if (this.lastStoreInitKey === key) {
      return;
    }

    this.lastStoreInitKey = key;

    const bindingDefaults: Record<string, unknown> = {};
    if (this.initialState) {
      for (const [stateKey, value] of Object.entries(this.initialState)) {
        if (stateKey.startsWith("$")) {
          bindingDefaults[stateKey] = value;
        } else {
          this.store.set(stateKey, value);
        }
      }
    }

    this.store.initialize(defaults, bindingDefaults);
  }

  private refreshEvaluatedState(): void {
    if (!this.library || !this.latestParseResult) {
      this.rootNode = null;
      this.latestRuntimeErrors = [];
      this.emitCurrentErrors();
      this.cdr.markForCheck();
      return;
    }

    const runtimeErrors: OpenUIError[] = [];
    this.renderErrors.clear();

    this.rootNode = this.latestParseResult.root
      ? evaluateElementProps(this.latestParseResult.root, {
          ctx: this.evaluationContext,
          library: this.library,
          store: this.store,
          errors: runtimeErrors,
        })
      : null;

    this.latestRuntimeErrors = runtimeErrors;
    this.emitCurrentErrors();
    this.cdr.markForCheck();
  }

  private getRenderErrorKey(component?: string, statementId?: string): string {
    return `${statementId ?? ""}::${component ?? ""}`;
  }

  private recordRenderError(error: OpenUIError): void {
    this.renderErrors.set(this.getRenderErrorKey(error.component, error.statementId), error);
    this.emitCurrentErrors();
  }

  private clearRenderError(component?: string, statementId?: string): void {
    const key = this.getRenderErrorKey(component, statementId);
    if (this.renderErrors.delete(key)) {
      this.emitCurrentErrors();
    }
  }

  private emitCurrentErrors(): void {
    this.error.emit([
      ...this.mapValidationErrors(this.latestParseResult?.meta.errors ?? []),
      ...this.latestRuntimeErrors,
      ...this.querySnapshot.__openui_errors,
      ...this.renderErrors.values(),
    ]);
  }

  private evaluateQueryAndMutationNodes(): void {
    if (!this.latestParseResult) {
      this.queryManager.evaluateQueries([]);
      this.queryManager.registerMutations([]);
      return;
    }

    if (!this.isStreaming) {
      const queryNodes = this.latestParseResult.queryStatements.map((statement) => {
        const relevantDeps: Record<string, unknown> = {};
        if (statement.deps) {
          for (const ref of statement.deps) {
            relevantDeps[ref] = this.store.getSnapshot()[ref];
          }
        }

        return {
          statementId: statement.statementId,
          toolName: statement.toolAST
            ? (evaluate(statement.toolAST, this.evaluationContext) as string)
            : "",
          args: statement.argsAST ? evaluate(statement.argsAST, this.evaluationContext) : null,
          defaults: statement.defaultsAST
            ? evaluate(statement.defaultsAST, this.evaluationContext)
            : null,
          refreshInterval: statement.refreshAST
            ? (evaluate(statement.refreshAST, this.evaluationContext) as number)
            : undefined,
          deps: Object.keys(relevantDeps).length > 0 ? relevantDeps : undefined,
          complete: statement.complete,
        };
      });

      this.queryManager.evaluateQueries(queryNodes);

      const mutationNodes = this.latestParseResult.mutationStatements.map((statement) => ({
        statementId: statement.statementId,
        toolName: statement.toolAST
          ? (evaluate(statement.toolAST, this.evaluationContext) as string)
          : "",
      }));

      this.queryManager.registerMutations(mutationNodes);
    }

    this.querySnapshot = this.queryManager.getSnapshot();
    this.context.isQueryLoading = this.querySnapshot.__openui_loading.length > 0;
  }

  private getFieldValue(formName: string | undefined, name: string): unknown {
    if (!formName) {
      return unwrapFieldValue(this.store.get(name));
    }

    const formData = this.store.get(formName);
    if (!formData || typeof formData !== "object" || Array.isArray(formData)) {
      return undefined;
    }

    return unwrapFieldValue((formData as Record<string, unknown>)[name]);
  }

  private setFieldValue(
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: unknown,
    shouldTriggerSaveCallback: boolean,
  ): void {
    const wrapped = { value, componentType };

    if (!formName) {
      this.store.set(name, wrapped);
    } else {
      const raw = this.store.get(formName);
      const formData =
        raw && typeof raw === "object" && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : {};
      this.store.set(formName, { ...formData, [name]: wrapped });
    }

    if (shouldTriggerSaveCallback) {
      this.stateUpdate.emit(this.store.getSnapshot());
    }
  }

  private getFormPayload(formName?: string): Record<string, unknown> | undefined {
    if (formName) {
      const raw = this.store.get(formName);
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return { [formName]: raw as Record<string, unknown> };
      }
    }

    return this.store.getSnapshot();
  }

  private async triggerAction(
    userMessage: string,
    formName?: string,
    action?: ActionPlan | ActionConfig,
  ): Promise<void> {
    const formPayload = this.getFormPayload(formName);

    if (action && !("steps" in action)) {
      const actionType = action.type || BuiltinActionType.ContinueConversation;
      const params = { ...(action.params || {}) };
      const legacy = action as Record<string, unknown>;
      if (typeof legacy["url"] === "string") params["url"] = legacy["url"];
      if (typeof legacy["context"] === "string") params["context"] = legacy["context"];

      this.action.emit({
        type: actionType,
        params,
        humanFriendlyMessage: userMessage,
        formState: formPayload,
        formName,
      });
      return;
    }

    if (isActionPlan(action)) {
      let storeMutated = false;

      for (const step of action.steps) {
        switch (step.type) {
          case "continue_conversation":
            this.action.emit({
              type: BuiltinActionType.ContinueConversation,
              params: step.context ? { context: step.context } : {},
              humanFriendlyMessage: step.message,
              formState: formPayload,
              formName,
            });
            break;
          case "open_url":
            this.action.emit({
              type: BuiltinActionType.OpenUrl,
              params: { url: step.url },
              humanFriendlyMessage: "",
              formState: formPayload,
              formName,
            });
            break;
          case "set": {
            const value = evaluate(step.valueAST, this.evaluationContext);
            this.store.set(step.target, value);
            storeMutated = true;
            break;
          }
          case "reset": {
            const declarations = this.latestParseResult?.stateDeclarations ?? {};
            for (const target of step.targets) {
              this.store.set(target, declarations[target] ?? null);
            }
            storeMutated = true;
            break;
          }
          case "run": {
            if (step.refType === "mutation") {
              const statement = this.latestParseResult?.mutationStatements.find(
                (candidate) => candidate.statementId === step.statementId,
              );
              const evaluatedArgs = statement?.argsAST
                ? (evaluate(statement.argsAST, this.evaluationContext) as Record<string, unknown>)
                : {};
              await this.queryManager.fireMutation(step.statementId, evaluatedArgs);
            } else {
              this.queryManager.invalidate([step.statementId]);
            }
            break;
          }
        }
      }

      if (storeMutated) {
        this.stateUpdate.emit(this.store.getSnapshot());
      }
      return;
    }

    this.action.emit({
      type: BuiltinActionType.ContinueConversation,
      params: {},
      humanFriendlyMessage: userMessage,
      formState: formPayload,
      formName,
    });
  }

  private mapValidationErrors(errors: ValidationError[]): OpenUIError[] {
    return errors.map((validationError) => ({
      source: "parser",
      code: validationError.code,
      component: validationError.component,
      path: validationError.path,
      message: validationError.message,
      statementId: validationError.statementId,
    }));
  }
}
