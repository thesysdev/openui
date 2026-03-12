import type { ActionEvent, ParseResult } from "./internal";
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
