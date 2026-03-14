import { getContext, setContext } from "svelte";
import type { Snippet } from "svelte";
import type { Library } from "./library.js";

const OPENUI_CONTEXT_KEY = Symbol("openui-context");
const FORM_NAME_CONTEXT_KEY = Symbol("openui-form-name");

/**
 * Shared context provided by <Renderer /> to all rendered components.
 */
export interface OpenUIContextValue {
  /** The active component library (schema + renderers). */
  library: Library;

  /**
   * Render any value (element, array, primitive) into a Svelte snippet.
   */
  renderNode: (value: unknown) => Snippet;

  /**
   * Trigger an action. Components call this to fire structured ActionEvents.
   *
   * @param userMessage  Human-readable label ("Submit Application")
   * @param formName  Optional form name — if provided, form state for this form is included
   * @param action  Optional custom action config { type, params }
   */
  triggerAction: (
    userMessage: string,
    formName?: string,
    action?: { type?: string; params?: Record<string, any> },
  ) => void;

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
   */
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
}

/**
 * Set the OpenUI context. Called internally by <Renderer />.
 */
export function setOpenUIContext(value: OpenUIContextValue): void {
  setContext(OPENUI_CONTEXT_KEY, value);
}

/**
 * Access the full OpenUI context. Throws if used outside a <Renderer />.
 */
export function getOpenUI(): OpenUIContextValue {
  const ctx = getContext<OpenUIContextValue | undefined>(OPENUI_CONTEXT_KEY);
  if (!ctx) {
    throw new Error("getOpenUI must be used within a <Renderer /> component.");
  }
  return ctx;
}

/**
 * Get the renderNode function for rendering nested component values.
 */
export function getRenderNode() {
  return getOpenUI().renderNode;
}

/**
 * Get the triggerAction function for firing structured action events.
 *
 * @example
 * ```svelte
 * <script>
 *   import { getTriggerAction } from '@openuidev/svelte-lang';
 *   const triggerAction = getTriggerAction();
 * </script>
 * <button onclick={() => triggerAction("Submit", "myForm")}>Submit</button>
 * ```
 */
export function getTriggerAction() {
  return getOpenUI().triggerAction;
}

/**
 * Whether the LLM is currently streaming content.
 */
export function getIsStreaming() {
  return getOpenUI().isStreaming;
}

/**
 * Get a form field value from the form state context.
 *
 * @example
 * ```svelte
 * <script>
 *   import { getGetFieldValue } from '@openuidev/svelte-lang';
 *   const getFieldValue = getGetFieldValue();
 *   const name = getFieldValue("contactForm", "name");
 * </script>
 * ```
 */
export function getGetFieldValue() {
  return getOpenUI().getFieldValue;
}

/**
 * Get the setFieldValue function for updating form field values.
 */
export function getSetFieldValue() {
  return getOpenUI().setFieldValue;
}

// ─── FormName context ───

/**
 * Set the form name context. Called by form components.
 */
export function setFormNameContext(name: string | undefined): void {
  setContext(FORM_NAME_CONTEXT_KEY, name);
}

/**
 * Get the current form name (set by the nearest parent Form component).
 * Returns undefined if not inside a Form.
 */
export function getFormName(): string | undefined {
  return getContext<string | undefined>(FORM_NAME_CONTEXT_KEY);
}
