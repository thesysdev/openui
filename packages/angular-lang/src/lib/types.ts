import type { Type } from "@angular/core";
import type { ActionEvent, McpClientLike, OpenUIError, ParseResult } from "@openuidev/lang-core";
import type { Library } from "./library";

export type OpenUiToolProvider =
  Record<string, (args: Record<string, unknown>) => Promise<unknown>> | McpClientLike | null;

export interface OpenUiRendererProps {
  response: string | null;
  library: Library;
  isStreaming?: boolean;
  initialState?: Record<string, unknown>;
  toolProvider?: OpenUiToolProvider;
  queryLoader?: Type<unknown> | null;
  onAction?: (event: ActionEvent) => void;
  onStateUpdate?: (state: Record<string, unknown>) => void;
  onParseResult?: (result: ParseResult | null) => void;
  onError?: (errors: OpenUIError[]) => void;
}
