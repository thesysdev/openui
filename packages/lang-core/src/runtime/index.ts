export { createStore } from "./store";
export type { Store } from "./store";

export { evaluate, isReactiveAssign, stripReactiveAssign } from "./evaluator";
export type { EvaluationContext, ReactiveAssign } from "./evaluator";

export { createQueryManager } from "./queryManager";
export type {
  MutationNode,
  MutationResult,
  QueryManager,
  QueryNode,
  QuerySnapshot,
  Transport,
} from "./queryManager";

export { evaluateElementProps } from "./evaluate-tree";
export type { EvalContext } from "./evaluate-tree";

export { resolveStateField } from "./state-field";
export type { InferStateFieldValue, StateField } from "./state-field";

export { createMcpTransport } from "./mcp-transport";
export type { McpClientLike, McpConnection, McpTool, McpTransportConfig } from "./mcp-transport";
