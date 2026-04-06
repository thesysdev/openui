import { createContext, createEffect, useContext, type Accessor, type JSX } from "solid-js";
import type { Library } from "./library";

export interface ActionConfig {
  type?: string;
  params?: Record<string, any>;
}

export interface OpenUIContextValue {
  library: Library;
  renderNode: (value: unknown) => JSX.Element;
  triggerAction: (userMessage: string, formName?: string, action?: ActionConfig) => void;
  isStreaming: Accessor<boolean>;
  getFieldValue: (formName: string | undefined, name: string) => any;
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
}

export const OpenUIContext = createContext<OpenUIContextValue>();
export const FormNameContext = createContext<Accessor<string | undefined>>();

export function useOpenUI(): OpenUIContextValue {
  const ctx = useContext(OpenUIContext);
  if (!ctx) {
    throw new Error("useOpenUI must be used within a <Renderer /> component.");
  }
  return ctx;
}

export function useRenderNode() {
  return useOpenUI().renderNode;
}

export function useTriggerAction() {
  return useOpenUI().triggerAction;
}

export function useIsStreaming(): Accessor<boolean> {
  return useOpenUI().isStreaming;
}

export function useGetFieldValue() {
  return useOpenUI().getFieldValue;
}

export function useSetFieldValue() {
  return useOpenUI().setFieldValue;
}

export function useFormName(): Accessor<string | undefined> | undefined {
  return useContext(FormNameContext);
}

export function useSetDefaultValue({
  formName,
  componentType,
  name,
  defaultValue,
  shouldTriggerSaveCallback = false,
}: {
  formName?: string;
  componentType?: string;
  name: string;
  defaultValue: unknown;
  shouldTriggerSaveCallback?: boolean;
}) {
  const ctx = useOpenUI();

  createEffect(() => {
    const existing = ctx.getFieldValue(formName, name);
    if (!ctx.isStreaming() && existing === undefined && defaultValue !== undefined) {
      ctx.setFieldValue(formName, componentType, name, defaultValue, shouldTriggerSaveCallback);
    }
  });
}
