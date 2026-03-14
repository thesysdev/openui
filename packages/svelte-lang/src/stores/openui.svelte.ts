import type { Snippet } from "svelte";
import type { OpenUIContextValue } from "../context.js";
import type { Library } from "../library.js";
import { createParser } from "../parser/parser.js";
import type { ActionEvent, ParseResult } from "../parser/types.js";
import { BuiltinActionType } from "../parser/types.js";

export interface OpenUIStateOptions {
  response: string | null;
  library: Library;
  isStreaming: boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
}

/**
 * Creates the core OpenUI state using Svelte 5 runes.
 *
 * This is the Svelte equivalent of the React `useOpenUIState` hook.
 * It manages parsing, form state, and context value assembly.
 */
export function createOpenUIState(
  options: () => OpenUIStateOptions,
  renderDeep: (value: unknown) => Snippet,
) {
  const opts = options();

  // Parser created once from library schema
  const parser = createParser(opts.library.toJSONSchema());

  // Form state
  let formState = $state<Record<string, any>>(opts.initialState ?? {});

  // Parse result - derived from response
  const result = $derived.by<ParseResult | null>(() => {
    const currentOpts = options();
    if (!currentOpts.response) return null;
    try {
      return parser.parse(currentOpts.response);
    } catch (e) {
      console.error("[openui] Parse error:", e);
      return null;
    }
  });

  // Track initialState changes
  let prevInitialState = opts.initialState;
  $effect(() => {
    const currentOpts = options();
    if (prevInitialState !== currentOpts.initialState) {
      prevInitialState = currentOpts.initialState;
      formState = currentOpts.initialState ?? {};
    }
  });

  // Stable callbacks
  function getFieldValue(formName: string | undefined, name: string): any {
    return formName ? formState[formName]?.[name]?.value : formState[name]?.value;
  }

  function setFieldValue(
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback: boolean = true,
  ): void {
    const newState = { ...formState };

    if (formName) {
      newState[formName] = {
        ...newState[formName],
        [name]: { value, componentType },
      };
    } else {
      newState[name] = { value, componentType };
    }

    formState = newState;

    if (shouldTriggerSaveCallback) {
      const currentOpts = options();
      currentOpts.onStateUpdate?.(newState);
    }
  }

  function triggerAction(
    userMessage: string,
    formName?: string,
    action?: { type?: string; params?: Record<string, any> },
  ): void {
    const currentOpts = options();
    const actionType = action?.type || BuiltinActionType.ContinueConversation;
    const actionParams = action?.params;

    let relevantState: Record<string, any> | undefined;
    if (formName && formState[formName]) {
      relevantState = { [formName]: formState[formName] };
    } else if (Object.keys(formState).length > 0) {
      relevantState = formState;
    }

    if (!currentOpts.onAction) return;

    currentOpts.onAction({
      type: actionType,
      params: actionParams || {},
      humanFriendlyMessage: userMessage,
      formState: relevantState,
      formName,
    });
  }

  // Context value - derived so it updates reactively
  const contextValue = $derived.by<OpenUIContextValue>(() => {
    const currentOpts = options();
    return {
      library: currentOpts.library,
      renderNode: renderDeep,
      triggerAction,
      isStreaming: currentOpts.isStreaming,
      getFieldValue,
      setFieldValue,
    };
  });

  return {
    get result() {
      return result;
    },
    get contextValue() {
      return contextValue;
    },
  };
}
