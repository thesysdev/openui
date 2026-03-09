import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OpenUIContextValue } from "../context";
import type { Library } from "../library";
import { createParser } from "../parser/parser";
import type { ActionEvent, ParseResult } from "../parser/types";
import { BuiltinActionType } from "../parser/types";
import {
  parseContext,
  separateContentAndContext,
  wrapContent,
  wrapContext,
} from "../utils/contentParser";

export interface UseOpenUIStateOptions {
  response: string | null;
  library: Library;
  isStreaming: boolean;
  onAction?: (event: ActionEvent) => void;
  updateMessage?: (message: string) => void;
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
  { response, library, isStreaming, onAction, updateMessage }: UseOpenUIStateOptions,
  renderDeep: (value: unknown) => React.ReactNode,
): OpenUIState {
  // ─── Parser (synchronous, created once from the library's JSON schema) ───
  const parser = useMemo(() => createParser(library.toJSONSchema()), []); // intentionally empty deps — parser is created once

  // ─── Content/context separation ───
  const { content: openuiCode, contextString } = useMemo(() => {
    if (!response) return { content: null, contextString: null };
    return separateContentAndContext(response);
  }, [response]);

  // ─── Form state ───
  const [formState, setFormState] = useState<Record<string, any>>(() =>
    parseContext(contextString),
  );

  const prevContextString = useRef(contextString);
  useEffect(() => {
    if (prevContextString.current !== contextString) {
      prevContextString.current = contextString;
      setFormState(parseContext(contextString));
    }
  }, [contextString]);

  // ─── Parse result ───
  const result = useMemo<ParseResult | null>(() => {
    if (!openuiCode) return null;
    try {
      return parser.parse(openuiCode);
    } catch (e) {
      console.error("[openui] Parse error:", e);
      return null;
    }
  }, [parser, openuiCode]);

  // Log the final parsed tree once streaming ends (dev debugging).
  const prevIsStreaming = useRef(isStreaming);
  useEffect(() => {
    prevIsStreaming.current = isStreaming;
  }, [isStreaming, result]);

  // ─── Ref for stable callbacks ───
  const propsRef = useRef({
    formState,
    openuiCode: openuiCode ?? "",
    onAction,
    updateMessage,
  });
  propsRef.current = {
    formState,
    openuiCode: openuiCode ?? "",
    onAction,
    updateMessage,
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
        const latestCode = propsRef.current.openuiCode;
        const latestUpdate = propsRef.current.updateMessage;
        if (latestUpdate) {
          const contextJson = JSON.stringify([newState]);
          const fullMessage = latestCode + "\n" + wrapContext(contextJson);
          latestUpdate(fullMessage);
        }
      }
    },
    [],
  );

  // ─── triggerAction ───
  const triggerAction = useCallback(
    (
      userMessage: string,
      actionContext: string,
      formName?: string,
      action?: { type?: string; params?: Record<string, any> },
    ) => {
      const { formState: currentState, onAction: handler } = propsRef.current;
      const actionType = action?.type || BuiltinActionType.ContinueConversation;
      const actionParams = action?.params;

      const messageCtx: (string | object)[] = [actionContext];
      if (formName && currentState[formName]) {
        messageCtx.push({ [formName]: currentState[formName] });
      } else if (Object.keys(currentState).length > 0) {
        messageCtx.push(currentState);
      }

      const contentPart = userMessage ? wrapContent(userMessage) : "";
      const contextPart = wrapContext(JSON.stringify(messageCtx));
      const llmFriendlyMessage = `${contentPart}${contextPart}`;

      if (!handler) return;

      if (actionType === BuiltinActionType.ContinueConversation) {
        handler({
          type: BuiltinActionType.ContinueConversation,
          params: {
            humanFriendlyMessage: userMessage,
            llmFriendlyMessage,
          },
          humanFriendlyMessage: userMessage,
          llmFriendlyMessage,
        });
      } else {
        handler({
          type: actionType,
          params: actionParams || {},
          humanFriendlyMessage: userMessage,
          llmFriendlyMessage,
        });
      }
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
