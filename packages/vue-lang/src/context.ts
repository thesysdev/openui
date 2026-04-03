import type { InjectionKey, Ref } from "vue";
import { inject, provide, watchEffect } from "vue";
import type { Library, RenderNodeResult } from "./library.js";

// ─── Action config ───

export interface ActionConfig {
  type?: string;
  params?: Record<string, any>;
}

// ─── OpenUI context ───

/**
 * Shared context provided by <Renderer /> to all rendered components.
 *
 * Vue passes `renderNode` via context, idiomatic for Vue's provide/inject model.
 */
export interface OpenUIContextValue {
  /** The active component library (schema + renderers). */
  library: Library;

  /** Render a parsed value into VNodes. */
  renderNode: (value: unknown) => RenderNodeResult;

  /**
   * Trigger an action. Components call this to fire structured ActionEvents.
   *
   * @param userMessage  Human-readable label ("Submit Application")
   * @param formName  Optional form name — if provided, form state for this form is included
   * @param action  Optional custom action config { type, params }
   */
  triggerAction: (userMessage: string, formName?: string, action?: ActionConfig) => void;

  /** Whether the LLM is currently streaming content. */
  isStreaming: Ref<boolean>;

  /** Get a form field value. Returns undefined if not set. */
  getFieldValue: (formName: string | undefined, name: string) => any;

  /**
   * Set a form field value.
   *
   * @param formName  The form's name prop
   * @param componentType  The component type (e.g. "Input", "Select", "RadioGroup")
   * @param name  The field's name prop
   * @param value  The new value
   * @param shouldTriggerSaveCallback  When true, persists the updated state via updateMessage.
   *   Text inputs should pass `false` on change and `true` on blur.
   *   Discrete inputs (Select, RadioGroup, etc.) should always pass `true`.
   */
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
}

const OPENUI_CONTEXT_KEY: InjectionKey<OpenUIContextValue> = Symbol("openui-context");
const FORM_NAME_CONTEXT_KEY: InjectionKey<Ref<string | undefined>> = Symbol("openui-form-name");

// ─── Context providers ───

export function provideOpenUIContext(value: OpenUIContextValue): void {
  provide(OPENUI_CONTEXT_KEY, value);
}

export function provideFormName(formName: Ref<string | undefined>): void {
  provide(FORM_NAME_CONTEXT_KEY, formName);
}

// ─── Context consumers (composables) ───

/**
 * Access the full OpenUI context. Throws if used outside a <Renderer />.
 */
export function useOpenUI(): OpenUIContextValue {
  const ctx = inject(OPENUI_CONTEXT_KEY);
  if (!ctx) {
    throw new Error("useOpenUI must be used within a <Renderer /> component.");
  }
  return ctx;
}

/**
 * Get the renderNode function for rendering child values into VNodes.
 */
export function useRenderNode() {
  return useOpenUI().renderNode;
}

/**
 * Get the triggerAction function for firing structured action events.
 */
export function useTriggerAction() {
  return useOpenUI().triggerAction;
}

/**
 * Returns the reactive isStreaming ref.
 * Use as: `const isStreaming = useIsStreaming(); ... :disabled="isStreaming"`
 */
export function useIsStreaming(): Ref<boolean> {
  return useOpenUI().isStreaming;
}

/**
 * Get a form field value from the form state context.
 */
export function useGetFieldValue() {
  return useOpenUI().getFieldValue;
}

/**
 * Get the setFieldValue function for updating form field values.
 */
export function useSetFieldValue() {
  return useOpenUI().setFieldValue;
}

/**
 * Get the current form name (set by the nearest parent Form component).
 * Returns a ref that may be undefined if not inside a Form.
 */
export function useFormName(): Ref<string | undefined> | undefined {
  return inject(FORM_NAME_CONTEXT_KEY);
}

// ─── Default value helper ───

/**
 * Persists a component's default/initial value into form state once streaming
 * finishes — but only if the user hasn't already set a value.
 */
export function useSetDefaultValue({
  formName,
  componentType,
  name,
  defaultValue,
  shouldTriggerSaveCallback = false,
}: {
  formName?: string;
  componentType: string;
  name: string;
  defaultValue: any;
  shouldTriggerSaveCallback?: boolean;
}): void {
  const ctx = useOpenUI();

  watchEffect(() => {
    const existing = ctx.getFieldValue(formName, name);
    if (!ctx.isStreaming.value && existing === undefined && defaultValue !== undefined) {
      ctx.setFieldValue(formName, componentType, name, defaultValue, shouldTriggerSaveCallback);
    }
  });
}
