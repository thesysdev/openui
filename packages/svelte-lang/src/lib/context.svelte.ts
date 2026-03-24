import { getContext, setContext } from "svelte";
import type { Library } from "./library.js";

// ─── Action config ───

export interface ActionConfig {
  type?: string;
  params?: Record<string, any>;
}

// ─── OpenUI context ───

/**
 * Shared context provided by <Renderer /> to all rendered components.
 *
 * Note: `renderNode` is passed as a snippet prop, NOT via context.
 * This avoids the stale-closure problem and matches Svelte's snippet model.
 */
export interface OpenUIContextValue {
  /** The active component library (schema + renderers). */
  library: Library;

  /**
   * Trigger an action. Components call this to fire structured ActionEvents.
   *
   * @param userMessage  Human-readable label ("Submit Application")
   * @param formName  Optional form name — if provided, form state for this form is included
   * @param action  Optional custom action config { type, params }
   */
  triggerAction: (userMessage: string, formName?: string, action?: ActionConfig) => void;

  /** Whether the LLM is currently streaming content. */
  isStreaming: boolean;

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

const OPENUI_CONTEXT_KEY = Symbol("openui-context");
const FORM_NAME_CONTEXT_KEY = Symbol("openui-form-name");

// ─── Context setters ───

export function setOpenUIContext(value: OpenUIContextValue): void {
  setContext(OPENUI_CONTEXT_KEY, value);
}

export function setFormNameContext(formName: string | undefined): void {
  setContext(FORM_NAME_CONTEXT_KEY, formName);
}

// ─── Context getters ───

/**
 * Access the full OpenUI context. Throws if used outside a <Renderer />.
 */
export function getOpenUIContext(): OpenUIContextValue {
  const ctx = getContext<OpenUIContextValue | undefined>(OPENUI_CONTEXT_KEY);
  if (!ctx) {
    throw new Error("getOpenUIContext must be used within a <Renderer /> component.");
  }
  return ctx;
}

/**
 * Get the triggerAction function for firing structured action events.
 */
export function getTriggerAction() {
  return getOpenUIContext().triggerAction;
}

/**
 * Whether the LLM is currently streaming content.
 * Returns a getter — use as `getIsStreaming()` for reactive reads.
 */
export function getIsStreaming(): boolean {
  return getOpenUIContext().isStreaming;
}

/**
 * Get a form field value from the form state context.
 */
export function getGetFieldValue() {
  return getOpenUIContext().getFieldValue;
}

/**
 * Get the setFieldValue function for updating form field values.
 */
export function getSetFieldValue() {
  return getOpenUIContext().setFieldValue;
}

/**
 * Get the current form name (set by the nearest parent Form component).
 * Returns undefined if not inside a Form.
 */
export function getFormName(): string | undefined {
  return getContext<string | undefined>(FORM_NAME_CONTEXT_KEY);
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
  existingValue,
  defaultValue,
  shouldTriggerSaveCallback = false,
}: {
  formName?: string;
  componentType: string;
  name: string;
  existingValue: any;
  defaultValue: any;
  shouldTriggerSaveCallback?: boolean;
}): void {
  const setFieldValue = getSetFieldValue();
  const ctx = getOpenUIContext();

  $effect(() => {
    if (!ctx.isStreaming && existingValue === undefined && defaultValue !== undefined) {
      setFieldValue(formName, componentType, name, defaultValue, shouldTriggerSaveCallback);
    }
  });
}
