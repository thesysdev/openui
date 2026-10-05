"use client";

import { useState } from "react";
import { Renderer } from "@openuidev/react-lang";
import {
  Button,
  defineArtifactRenderer,
  DotMatrixLoader,
  partialJSONParse,
  useThread,
} from "@openuidev/react-ui";
import { dashboardLibrary } from "@openuidev/react-ui/genui-lib";
import type { MiniApp } from "./miniapp";
import { readAppState, saveAppState } from "./storage";

function MiniAppView({ app, isStreaming }: { app: MiniApp; isStreaming: boolean }) {
  const [initialState] = useState(() => readAppState(app.id));
  const [storageError, setStorageError] = useState<string | null>(null);
  const { processMessage } = useThread();
  return (
    <div className="miniapp-content">
      {storageError && <p role="alert">{storageError}</p>}
      <Renderer
        response={app.response}
        library={dashboardLibrary}
        isStreaming={isStreaming}
        initialState={initialState}
        onStateUpdate={(state) => {
          try {
            saveAppState(app.id, state);
            setStorageError(null);
          } catch {
            setStorageError(
              "Your browser could not save input state. Free some local storage and try again.",
            );
          }
        }}
        queryLoader={
          <div className="query-loader" role="status">
            <DotMatrixLoader variant="compact" />
            <span>Loading data…</span>
          </div>
        }
        onAction={(action) => processMessage({ role: "user", content: JSON.stringify(action) })}
        toolProvider={{
          async callTool({
            name,
            arguments: args = {},
          }: {
            name: string;
            arguments?: Record<string, unknown>;
          }) {
            // Explicit browser dispatch takes precedence; all other names go to the server.
            if (name === "copy_text") {
              await navigator.clipboard.writeText(String(args.text));
              return { content: [], structuredContent: { copied: true } };
            }
            const response = await fetch("/api/tools", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, arguments: args, response: app.response }),
              signal: AbortSignal.timeout(65_000),
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error ?? "Data request failed");
            return { content: [], structuredContent: body.result };
          },
        }}
      />
    </div>
  );
}

export const miniAppRenderer = defineArtifactRenderer<MiniApp>({
  type: "miniapp",
  label: "MiniApp",
  toolName: "build_miniapp",
  parser: ({ args, response }) => {
    const value = response ?? args;
    const app = (typeof value === "string" ? partialJSONParse(value) : value) as MiniApp | null;
    if (!app?.id || !app.name || !app.version) return null;
    return { props: app, meta: { id: app.id, version: app.version, heading: app.name } };
  },
  preview: (app, controls) => (
    <Button className="miniapp-preview" variant="secondary" onClick={controls.open}>
      <strong>{app.name}</strong>
      <span>
        {controls.isStreaming ? "Building MiniApp…" : `Open MiniApp · Version ${app.version}`}
      </span>
    </Button>
  ),
  // AgentInterface supplies the preview and portal; use Renderer for its content.
  actual: (app, controls) => (
    <MiniAppView key={app.id} app={app} isStreaming={controls.isStreaming} />
  ),
});
