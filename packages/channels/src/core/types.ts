// Core machinery types: the engine, walker, and store contracts. Shared UI
// contracts (Block, ChartSpec, FieldSpec, FormSpec) live in src/ui.
import type { ActionPlan, ElementNode, Library } from "@openuidev/lang-core";
import type { ChartSpec, FormSpec } from "../ui/types";

/** The $state snapshot persisted per message and threaded through renders. */
export type Snapshot = Record<string, unknown>;

/** What an interactive element does: run a button's ActionPlan, or set a bound $variable. */
export type ActionEntry = { kind: "action"; plan: ActionPlan } | { kind: "input"; target: string };

/**
 * One user interaction, normalized across platforms. Platforms report three
 * shapes, all expressible here:
 *   - a control change (Slack input):        { actionId, value }
 *   - a button press (all platforms):        { actionId }
 *   - a batched submit (Teams Action.Submit,
 *     Slack view_submission, WhatsApp Flow): { actionId, patch }
 * `patch` merges into $state first; then `actionId`'s plan (a button's action,
 * or a form's on-submit action looked up by form id) runs against the store.
 */
export type Interaction = {
  actionId?: string;
  value?: unknown;
  patch?: Snapshot;
};

/** The result of rendering one openui-lang program to a platform's output type. */
export type RenderResult<Out> = {
  output: Out;
  /** Notification fallback text. */
  text: string;
  /** action id -> what to do when that element is used. */
  actionMap: Record<string, ActionEntry>;
  /** Charts to rasterize and deliver however the platform prefers. */
  charts: ChartSpec[];
  /** form id -> spec, used to open the platform's form surface. */
  forms: Record<string, FormSpec>;
  /** $state snapshot to persist for the next interaction. */
  state: Snapshot;
};

/** Render context handed to every component's render function. */
export interface WalkCtx {
  /** Current $state snapshot (initial values for bound inputs). */
  state: Snapshot;
  /** Recurse into a child node or array of nodes; unknown nodes yield []. */
  walk(children: unknown): unknown[];
  /** Stable interaction id: statementId, or a walk-order counter per prefix. */
  idFor(node: ElementNode, prefix?: string): string;
  /** The $variable a bound prop writes to, if the value is a ReactiveAssign. */
  bindTarget(value: unknown): string | undefined;
  registerAction(id: string, entry: ActionEntry): void;
  /** Record a chart request; returns the id to key its placeholder with. */
  addChart(spec: Omit<ChartSpec, "id">): string;
  registerForm(id: string, spec: FormSpec): void;
}

/** Arguments to a component's render function. */
export interface RenderArgs {
  props: Record<string, any>;
  node: ElementNode;
  ctx: WalkCtx;
}

/** A component's renderer: resolved props -> platform output nodes. */
export type RenderFn = (args: RenderArgs) => unknown[];

/**
 * A platform package's public face: the lang-core library whose components
 * carry render functions, plus the platform's message envelope.
 */
export interface ChannelLibrary<Out> {
  library: Library<RenderFn>;
  /** Wrap walked items into a message payload (apply platform limits, fallback text). */
  finalize(items: unknown[], root: ElementNode): { output: Out; text: string };
  /** Shown when the model output doesn't parse into a root component. */
  errorMessage(): { output: Out; text: string };
}

/** The openui-lang source and $state stored per message. */
export type MessageState = { source: string; state: Snapshot };

/** Identifies one posted message across platforms. */
export interface MessageRef {
  platform: string;
  conversationId: string;
  messageId: string;
}

/** Caller-owned persistence for per-message UI state. */
export interface MessageStore {
  get(ref: MessageRef): Promise<MessageState | undefined>;
  save(ref: MessageRef, state: MessageState): Promise<void>;
}
