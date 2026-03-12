import type { AGUIEvent } from "@ag-ui/core";

export interface StreamProtocolAdapter {
  parse(response: Response): AsyncIterable<AGUIEvent>;
}

export { EventType } from "@ag-ui/core";
export type { AGUIEvent } from "@ag-ui/core";
