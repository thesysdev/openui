import { inject } from "@angular/core";
import type {
  ActionPlan,
  EvaluationContext,
  OpenUIError,
  ParseResult,
  Store,
} from "@openuidev/lang-core";
import type { Library } from "./library";
import { OPENUI_CONTEXT, OPENUI_FORM_NAME } from "./tokens";

export interface ActionConfig {
  type?: string;
  params?: Record<string, unknown>;
}

export interface SetDefaultValueOptions {
  formName?: string;
  componentType?: string;
  name: string;
  existingValue: unknown;
  defaultValue: unknown;
  isStreaming?: boolean;
  shouldTriggerSaveCallback?: boolean;
}

export interface OpenUiContextValue {
  library: Library | null;
  isStreaming: boolean;
  renderNode: (value: unknown) => unknown;
  triggerAction: (
    userMessage: string,
    formName?: string,
    action?: ActionPlan | ActionConfig,
  ) => void | Promise<void>;
  getFieldValue: (formName: string | undefined, name: string) => unknown;
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: unknown,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
  store: Store;
  evaluationContext: EvaluationContext;
  isQueryLoading: boolean;
  reportParseResult: ((result: ParseResult | null) => void) | null;
  reportErrors: ((errors: OpenUIError[]) => void) | null;
  reportError?: (error: OpenUIError) => void;
  clearError?: (component?: string, statementId?: string) => void;
}

export function injectOpenUiContext(): OpenUiContextValue {
  return inject(OPENUI_CONTEXT);
}

export function injectRenderNode(): OpenUiContextValue["renderNode"] {
  return injectOpenUiContext().renderNode;
}

export function injectTriggerAction(): OpenUiContextValue["triggerAction"] {
  return injectOpenUiContext().triggerAction;
}

export function injectIsStreaming(): boolean {
  return injectOpenUiContext().isStreaming;
}

export function injectIsQueryLoading(): boolean {
  return injectOpenUiContext().isQueryLoading;
}

export function injectGetFieldValue(): OpenUiContextValue["getFieldValue"] {
  return injectOpenUiContext().getFieldValue;
}

export function injectSetFieldValue(): OpenUiContextValue["setFieldValue"] {
  return injectOpenUiContext().setFieldValue;
}

export function injectStore(): Store {
  return injectOpenUiContext().store;
}

export function injectEvaluationContext(): EvaluationContext {
  return injectOpenUiContext().evaluationContext;
}

export function injectFormName(): string | undefined {
  return inject(OPENUI_FORM_NAME, { optional: true }) ?? undefined;
}

export function setDefaultValue(
  options: SetDefaultValueOptions,
  context: Pick<OpenUiContextValue, "setFieldValue"> | null = null,
): void {
  const resolvedContext = context ?? injectOpenUiContext();

  if (
    !options.isStreaming &&
    options.existingValue === undefined &&
    options.defaultValue !== undefined
  ) {
    resolvedContext.setFieldValue(
      options.formName,
      options.componentType,
      options.name,
      options.defaultValue,
      options.shouldTriggerSaveCallback ?? false,
    );
  }
}
