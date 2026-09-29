import {
  BuiltinActionType,
  type ActionEvent,
  type OpenUIError,
  type ParseResult,
} from "@openuidev/lang-core";
import {
  Renderer as OpenUIRenderer,
  type Library,
  type RendererProps as OpenUIRendererProps,
} from "@openuidev/react-lang";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { A2UIClient } from "./client";
import { dataModelToOpenUIState, toJsonObject } from "./json-pointer";
import type { MapOpenUIAction, OpenUIActionOptions, SurfaceSnapshot } from "./types";

export interface A2UIRendererProps {
  client: A2UIClient;
  surfaceId: string;
  library: Library;
  mapAction?: MapOpenUIAction;
  onAction?: (event: ActionEvent, surface: SurfaceSnapshot) => void;
  /** Handles OpenUI @OpenUrl locally. Defaults to window.open in browsers. */
  onOpenUrl?: (url: string, event: ActionEvent, surface: SurfaceSnapshot) => void;
  onStateUpdate?: (state: Record<string, unknown>, surface: SurfaceSnapshot) => void;
  onParseResult?: (result: ParseResult | null) => void;
  onError?: (errors: OpenUIError[]) => void;
  /** Whether the surrounding A2UI transport is still delivering this agent turn. */
  isStreaming?: boolean;
  /** Additional top-level data-model keys that should hydrate form namespaces. */
  formStateKeys?: readonly string[];
  toolProvider?: OpenUIRendererProps["toolProvider"];
  queryLoader?: OpenUIRendererProps["queryLoader"];
}

function collectFormStateKeys(result: ParseResult | null): string[] {
  const keys = new Set<string>();
  const seen = new WeakSet<object>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const object = value as Record<string, unknown>;
    if (object.type === "element" && object.typeName === "Form") {
      const props = object.props as Record<string, unknown> | undefined;
      if (typeof props?.name === "string") keys.add(props.name);
    }
    for (const child of Object.values(object)) visit(child);
  };
  visit(result?.root);
  return [...keys];
}

export function A2UIRenderer({
  client,
  surfaceId,
  library,
  mapAction,
  onAction,
  onOpenUrl,
  onStateUpdate,
  onParseResult,
  onError,
  isStreaming = false,
  formStateKeys,
  toolProvider,
  queryLoader,
}: A2UIRendererProps) {
  const subscribe = useCallback((notify: () => void) => client.subscribe(notify), [client]);
  const getSnapshot = useCallback(() => client.getSurface(surfaceId), [client, surfaceId]);
  const surface = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const initialState = useMemo(() => {
    if (!surface) return undefined;
    const keys = new Set([...collectFormStateKeys(surface.parseResult), ...(formStateKeys ?? [])]);
    return dataModelToOpenUIState(surface.dataModel, keys);
  }, [formStateKeys, surface]);
  const agentToolProvider = useMemo<NonNullable<OpenUIRendererProps["toolProvider"]>>(
    () => ({
      async callTool({
        name,
        arguments: args,
      }: {
        name: string;
        arguments?: Record<string, unknown>;
      }) {
        const value = await client.callAgentFunction({
          surfaceId,
          call: name,
          args: toJsonObject(args),
        });
        return { content: [], structuredContent: value };
      },
    }),
    [client, surfaceId],
  );

  const handleAction = useCallback(
    (event: ActionEvent) => {
      const current = client.getSurface(surfaceId);
      if (!current) return;
      if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.url;
        if (typeof url === "string") {
          if (onOpenUrl) onOpenUrl(url, event, current);
          else if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
        }
        onAction?.(event, current);
        return;
      }
      const options: OpenUIActionOptions = mapAction?.(event, current) ?? {};
      client.dispatchOpenUIAction(surfaceId, event, options);
      onAction?.(event, current);
    },
    [client, mapAction, onAction, onOpenUrl, surfaceId],
  );

  const handleStateUpdate = useCallback(
    (state: Record<string, unknown>) => {
      if (!client.updateSurfaceFromOpenUIState(surfaceId, state)) return;
      const current = client.getSurface(surfaceId);
      if (current) onStateUpdate?.(state, current);
    },
    [client, onStateUpdate, surfaceId],
  );

  if (!surface) return null;

  return (
    <OpenUIRenderer
      response={surface.source}
      library={library}
      initialState={initialState}
      isStreaming={isStreaming}
      onAction={handleAction}
      onStateUpdate={handleStateUpdate}
      onParseResult={onParseResult}
      onError={onError}
      toolProvider={toolProvider ?? agentToolProvider}
      queryLoader={queryLoader}
    />
  );
}
