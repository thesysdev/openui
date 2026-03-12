import type { OpenUIControllerState } from "./internal";
import { createContext } from "svelte";
import type { Component } from "svelte";
import { get, type Readable } from "svelte/store";
import type { Library } from "./library";

export interface OpenUIContextValue {
  state: Readable<OpenUIControllerState<Library> | null>;
  renderNode: Component<{ value: unknown }>;
  triggerAction: (
    userMessage: string,
    formName?: string,
    action?: { type?: string; params?: Record<string, any> },
  ) => void;
  getFieldValue: (formName: string | undefined, name: string) => any;
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
}

const [consumeOpenUIContext, provideOpenUIContext] = createContext<OpenUIContextValue>();
const [consumeFormNameContext, provideFormNameContext] = createContext<string | undefined>();

export { provideFormNameContext, provideOpenUIContext };

export function getOpenUI(): OpenUIContextValue {
  return consumeOpenUIContext();
}

export function getOpenUIState(): Readable<OpenUIControllerState<Library> | null> {
  return getOpenUI().state;
}

export function getRenderNode(): Component<{ value: unknown }> {
  return getOpenUI().renderNode;
}

export function getTriggerAction() {
  return getOpenUI().triggerAction;
}

export function getIsStreaming(): boolean {
  return get(getOpenUI().state)?.isStreaming ?? false;
}

export function getFieldValueResolver() {
  return getOpenUI().getFieldValue;
}

export function getSetFieldValue() {
  return getOpenUI().setFieldValue;
}

export function getFormName(): string | undefined {
  return consumeFormNameContext() ?? undefined;
}
