import type { ActionEvent, ElementNode, ParseResult } from "@openuidev/lang-core";
import { BuiltinActionType, createParser } from "@openuidev/lang-core";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  Show,
  Switch,
  type JSX,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { OpenUIContext, type ActionConfig } from "./context";
import type { Library } from "./library";

export interface RendererProps {
  response: string | null;
  library: Library;
  isStreaming?: boolean;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, any>) => void;
  initialState?: Record<string, any>;
  onParseResult?: (result: ParseResult | null) => void;
}

function renderDeep(value: unknown, library: Library, renderNode: (value: unknown) => JSX.Element) {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return <For each={value}>{(item) => <>{renderDeep(item, library, renderNode)}</>}</For>;
  }
  if (typeof value === "object" && (value as any).type === "element") {
    return <RenderNode node={value as ElementNode} library={library} renderNode={renderNode} />;
  }
  return null;
}

function RenderNode(props: {
  node: ElementNode;
  library: Library;
  renderNode: (value: unknown) => JSX.Element;
}) {
  const Comp = () => props.library.components[props.node.typeName]?.component;

  return (
    <Show when={Comp()}>
      {(ResolvedComp) => (
        <Dynamic
          component={ResolvedComp()}
          props={props.node.props}
          renderNode={props.renderNode}
        />
      )}
    </Show>
  );
}

export function Renderer(props: RendererProps) {
  const parser = createParser(props.library.toJSONSchema());

  const [formState, setFormState] = createSignal<Record<string, any>>(props.initialState ?? {});
  const [previousInitialState, setPreviousInitialState] = createSignal(props.initialState);

  createEffect(() => {
    if (previousInitialState() !== props.initialState) {
      setPreviousInitialState(props.initialState);
      setFormState(props.initialState ?? {});
    }
  });

  const result = createMemo<ParseResult | null>(() => {
    if (!props.response) return null;
    try {
      return parser.parse(props.response);
    } catch (error) {
      console.error("[openui] Parse error:", error);
      return null;
    }
  });

  createEffect(() => {
    props.onParseResult?.(result());
  });

  function getFieldValue(formName: string | undefined, name: string): any {
    const state = formState();
    return formName ? state[formName]?.[name]?.value : state[name]?.value;
  }

  function setFieldValue(
    formName: string | undefined,
    componentType: string | undefined,
    name: string,
    value: any,
    shouldTriggerSaveCallback: boolean = true,
  ): void {
    setFormState((prev) => {
      const next = { ...prev };

      if (formName) {
        next[formName] = {
          ...next[formName],
          [name]: { value, componentType },
        };
      } else {
        next[name] = { value, componentType };
      }

      if (shouldTriggerSaveCallback && props.onStateUpdate) {
        props.onStateUpdate(next);
      }

      return next;
    });
  }

  function triggerAction(userMessage: string, formName?: string, action?: ActionConfig): void {
    const actionType = action?.type || BuiltinActionType.ContinueConversation;
    const actionParams = action?.params;
    const state = formState();

    let relevantState: Record<string, any> | undefined;
    if (formName && state[formName]) {
      relevantState = { [formName]: state[formName] };
    } else if (Object.keys(state).length > 0) {
      relevantState = state;
    }

    if (!props.onAction) return;

    props.onAction({
      type: actionType,
      params: actionParams || {},
      humanFriendlyMessage: userMessage,
      formState: relevantState,
      formName,
    });
  }

  const renderNode = (value: unknown) => renderDeep(value, props.library, renderNode);

  const contextValue = {
    get library() {
      return props.library;
    },
    renderNode,
    triggerAction,
    isStreaming: () => props.isStreaming ?? false,
    getFieldValue,
    setFieldValue,
  };

  return (
    <OpenUIContext.Provider value={contextValue}>
      <Switch>
        <Match when={result()?.root}>
          {(root) => <RenderNode node={root()} library={props.library} renderNode={renderNode} />}
        </Match>
      </Switch>
    </OpenUIContext.Provider>
  );
}
