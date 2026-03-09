import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OpenUIContextValue } from "../context";
import type { Library } from "../library";
import { createParser } from "../parser/parser";
import type { ActionEvent, ParseResult } from "../parser/types";
import { BuiltinActionType } from "../parser/types";

export interface UseOpenUIStateOptions {
  response: string | null;
  library: Library;
  isStreaming: boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
}

export interface OpenUIState {
  result: ParseResult | null;
  contextValue: OpenUIContextValue;
}

/**
 * Core state hook — extracts all form state, action handling, parser
 * management, and context assembly out of the Renderer component.
 *
 * - propsRef avoids stale closures in callbacks
 * - stable getFieldValue/setFieldValue/triggerAction via useCallback([])
 * - setFieldValue accepts shouldTriggerSaveCallback (blur-based persistence for text inputs)
 */
export function useOpenUIState(
  { response, library, isStreaming, onAction, onStateUpdate, initialState }: UseOpenUIStateOptions,
  renderDeep: (value: unknown) => React.ReactNode,
): OpenUIState {
  // ─── Parser (synchronous, created once from the library's JSON schema) ───
  const parser = useMemo(() => createParser(library.toJSONSchema()), []); // intentionally empty deps — parser is created once

  // ─── Parse result ───
  const result = useMemo<ParseResult | null>(() => {
    if (!response) return null;
    try {
      return parser.parse(response);
    } catch (e) {
      console.error("[openui] Parse error:", e);
      return null;
    }
  }, [parser, response]);

  // Log the final parsed tree once streaming ends (dev debugging).
  const prevIsStreaming = useRef(isStreaming);
  useEffect(() => {
    prevIsStreaming.current = isStreaming;
  }, [isStreaming, result]);

  // ─── Form state ───
  const [formState, setFormState] = useState<Record<string, any>>(() => initialState ?? {});

  // Sync if initialState changes (e.g. loading a different message)
  const prevInitialFormState = useRef(initialState);
  useEffect(() => {
    if (prevInitialFormState.current !== initialState) {
      prevInitialFormState.current = initialState;
      setFormState(initialState ?? {});
    }
  }, [initialState]);

  // ─── Ref for stable callbacks ───
  const propsRef = useRef({
    formState,
    onAction,
    onStateUpdate,
  });
  propsRef.current = {
    formState,
    onAction,
    onStateUpdate,
  };

  // ─── getFieldValue ───
  const getFieldValue = useCallback((formName: string | undefined, name: string) => {
    const state = propsRef.current.formState;
    return formName ? state[formName]?.[name]?.value : state[name]?.value;
  }, []);

  // ─── setFieldValue ───
  const setFieldValue = useCallback(
    (
      formName: string | undefined,
      componentType: string | undefined,
      name: string,
      value: any,
      shouldTriggerSaveCallback: boolean = true,
    ) => {
      const { formState: currentState } = propsRef.current;
      const newState = { ...currentState };

      if (formName) {
        newState[formName] = {
          ...newState[formName],
          [name]: { value, componentType },
        };
      } else {
        newState[name] = { value, componentType };
      }

      setFormState(newState);
      propsRef.current.formState = newState;

      if (shouldTriggerSaveCallback) {
        propsRef.current.onStateUpdate?.(newState);
      }
    },
    [],
  );

  // ─── triggerAction ───
  const triggerAction = useCallback(
    (
      userMessage: string,
      formName?: string,
      action?: { type?: string; params?: Record<string, any> },
    ) => {
      const { formState: currentState, onAction: handler } = propsRef.current;
      const actionType = action?.type || BuiltinActionType.ContinueConversation;
      const actionParams = action?.params;

      // Collect relevant form state
      let relevantState: Record<string, any> | undefined;
      if (formName && currentState[formName]) {
        relevantState = { [formName]: currentState[formName] };
      } else if (Object.keys(currentState).length > 0) {
        relevantState = currentState;
      }

      if (!handler) return;

      handler({
        type: actionType,
        params: actionParams || {},
        humanFriendlyMessage: userMessage,
        formState: relevantState,
        formName,
      });
    },
    [],
  );

  // ─── Context value ───
  const contextValue = useMemo<OpenUIContextValue>(
    () => ({
      library,
      renderNode: renderDeep,
      triggerAction,
      isStreaming,
      getFieldValue,
      setFieldValue,
    }),
    [library, renderDeep, isStreaming, triggerAction, getFieldValue, setFieldValue, formState],
  );

  return { result, contextValue };
}
