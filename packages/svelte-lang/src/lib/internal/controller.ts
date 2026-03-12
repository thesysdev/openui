import type { Library } from "./library";
import { createParser } from "./parser/parser";
import type { ActionEvent, ParseResult } from "./parser/types";
import { BuiltinActionType } from "./parser/types";

export interface OpenUIControllerOptions<TLibrary extends Library = Library> {
  response?: string | null;
  library: TLibrary;
  isStreaming?: boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
}

export interface OpenUIControllerState<TLibrary extends Library = Library> {
  response: string | null;
  result: ParseResult | null;
  formState: Record<string, any>;
  isStreaming: boolean;
  library: TLibrary;
}

type Listener = () => void;

export interface OpenUIController<TLibrary extends Library = Library> {
  subscribe: (listener: Listener) => () => void;
  getState: () => OpenUIControllerState<TLibrary>;
  setResponse: (response: string | null | undefined) => void;
  setInitialState: (initialState: Record<string, any> | undefined) => void;
  setLibrary: (library: TLibrary) => void;
  setStreaming: (isStreaming: boolean) => void;
  setCallbacks: (callbacks: {
    onAction?: (event: ActionEvent) => void;
    onStateUpdate?: (state: Record<string, any>) => void;
  }) => void;
  getFieldValue: (formName: string | undefined, name: string) => any;
  setFieldValue: (
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback?: boolean,
  ) => void;
  triggerAction: (
    userMessage: string,
    formName?: string,
    action?: { type?: string; params?: Record<string, any> },
  ) => void;
}

export function createOpenUIController<TLibrary extends Library = Library>({
  response = null,
  library,
  isStreaming = false,
  onAction,
  onStateUpdate,
  initialState,
}: OpenUIControllerOptions<TLibrary>): OpenUIController<TLibrary> {
  let parser = createParser(library.toJSONSchema());
  let responseText = response;
  let actionHandler = onAction;
  let stateUpdateHandler = onStateUpdate;
  let previousInitialState = initialState;
  let state: OpenUIControllerState<TLibrary> = {
    response,
    result: parseResponse(parser, response),
    formState: initialState ?? {},
    isStreaming,
    library,
  };
  const listeners = new Set<Listener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (nextState: OpenUIControllerState<TLibrary>) => {
    state = nextState;
    notify();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getState() {
      return state;
    },

    setResponse(nextResponse) {
      const normalized = nextResponse ?? null;
      if (responseText === normalized) return;
      responseText = normalized;
      setState({
        ...state,
        response: normalized,
        result: parseResponse(parser, normalized),
      });
    },

    setInitialState(nextInitialState) {
      if (previousInitialState === nextInitialState) return;
      previousInitialState = nextInitialState;
      setState({
        ...state,
        formState: nextInitialState ?? {},
      });
    },

    setLibrary(nextLibrary) {
      if (state.library === nextLibrary) return;
      parser = createParser(nextLibrary.toJSONSchema());
      setState({
        ...state,
        library: nextLibrary,
        result: parseResponse(parser, responseText),
      });
    },

    setStreaming(nextIsStreaming) {
      if (state.isStreaming === nextIsStreaming) return;
      setState({
        ...state,
        isStreaming: nextIsStreaming,
      });
    },

    setCallbacks(callbacks) {
      actionHandler = callbacks.onAction;
      stateUpdateHandler = callbacks.onStateUpdate;
    },

    getFieldValue(formName, name) {
      return formName ? state.formState[formName]?.[name]?.value : state.formState[name]?.value;
    },

    setFieldValue(formName, componentType, name, value, shouldTriggerSaveCallback = true) {
      const nextState = { ...state.formState };

      if (formName) {
        nextState[formName] = {
          ...nextState[formName],
          [name]: { value, componentType },
        };
      } else {
        nextState[name] = { value, componentType };
      }

      setState({
        ...state,
        formState: nextState,
      });

      if (shouldTriggerSaveCallback) {
        stateUpdateHandler?.(nextState);
      }
    },

    triggerAction(userMessage, formName, action) {
      if (!actionHandler) return;

      const actionType = action?.type || BuiltinActionType.ContinueConversation;
      const actionParams = action?.params;

      let relevantState: Record<string, any> | undefined;
      if (formName && state.formState[formName]) {
        relevantState = { [formName]: state.formState[formName] };
      } else if (Object.keys(state.formState).length > 0) {
        relevantState = state.formState;
      }

      actionHandler({
        type: actionType,
        params: actionParams || {},
        humanFriendlyMessage: userMessage,
        formState: relevantState,
        formName,
      });
    },
  };
}

function parseResponse(
  parser: ReturnType<typeof createParser>,
  response: string | null,
): ParseResult | null {
  if (!response) return null;

  try {
    return parser.parse(response);
  } catch (error) {
    console.error("[openui] Parse error:", error);
    return null;
  }
}
