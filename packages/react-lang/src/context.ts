import type { ReactNode } from "react";
import { createContext, useContext, useEffect } from "react";
import type { Library } from "./library";

/**
 * Shared context provided by <Renderer /> to all rendered components.
 */
export interface OpenUIContextValue {
  /** The active component library (schema + renderers). */
  library: Library;

  /**
   * Render any value (element, array, primitive) into React nodes.
   */
  renderNode: (value: unknown) => ReactNode;

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

export const OpenUIContext = createContext<OpenUIContextValue | null>(null);

/**
 * Access the full OpenUI context. Throws if used outside a <Renderer />.
 */
export function useOpenUI(): OpenUIContextValue {
  const ctx = useContext(OpenUIContext);
  if (!ctx) {
    throw new Error("useOpenUI must be used within a <Renderer /> component.");
  }
  return ctx;
}

/**
 * Get the renderNode function for rendering nested component values.
 */
export function useRenderNode() {
  return useOpenUI().renderNode;
}

/**
 * Get the triggerAction function for firing structured action events.
 *
 * @example
 * ```tsx
 * const triggerAction = useTriggerAction();
 * <button onClick={() => triggerAction("Submit", "myForm")}>
 * ```
 */
export function useTriggerAction() {
  return useOpenUI().triggerAction;
}

/**
 * Whether the LLM is currently streaming content.
 */
export function useIsStreaming() {
  return useOpenUI().isStreaming;
}

/**
 * Get a form field value from the form state context.
 *
 * @example
 * ```tsx
 * const getFieldValue = useGetFieldValue();
 * const name = getFieldValue("contactForm", "name");
 * ```
 */
export function useGetFieldValue() {
  return useOpenUI().getFieldValue;
}

/**
 * Get the setFieldValue function for updating form field values.
 *
 * @example
 * ```tsx
 * const setFieldValue = useSetFieldValue();
 * <input onChange={(e) => setFieldValue("contactForm", "Input", "name", e.target.value)} />
 * ```
 */
export function useSetFieldValue() {
  return useOpenUI().setFieldValue;
}

// ─── FormName context ───

export const FormNameContext = createContext<string | undefined>(undefined);

/**
 * Get the current form name (set by the nearest parent Form component).
 * Returns undefined if not inside a Form.
 */
export function useFormName(): string | undefined {
  return useContext(FormNameContext);
}

// ─── Default value helper ───

/**
 * Persists a component's default/initial value into form state once streaming
 * finishes — but only if the user hasn't already set a value.
 *
 * Call this inside any form component that has a `defaultValue` or
 * `defaultChecked` prop. It is a no-op during streaming so that LLM
 * prop changes don't fight with partial state.
 *
 * @param shouldTriggerSaveCallback — defaults to `false` (only local state, no message persistence)
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
}) {
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();

  useEffect(() => {
    if (!isStreaming && existingValue === undefined && defaultValue !== undefined) {
      setFieldValue(formName, componentType, name, defaultValue, shouldTriggerSaveCallback);
    }
  }, [existingValue, defaultValue, isStreaming]);
}
