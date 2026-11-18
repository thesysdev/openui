import type { Library, OpenUIError, ParseResult } from "@openuidev/lang-core";
import { enrichErrors, evaluateRoot, isElementNode } from "@openuidev/lang-core";
import type {
  ButtonElement,
  CardChild,
  CardElement,
  FieldElement,
  LinkButtonElement,
  RadioSelectElement,
  SelectElement,
} from "chat";
import { Actions, Card, CardText, Fields } from "chat";

/** Any element a component can render to: a card, a card child, or a piece of one. */
export type ChatNode =
  | CardElement
  | CardChild
  | ButtonElement
  | LinkButtonElement
  | SelectElement
  | RadioSelectElement
  | FieldElement;

export interface ChatRenderContext {
  /** True while the model is still streaming this component. */
  partial: boolean;
  /** Renders child components (a node, an array of nodes, or strings), skipping anything empty. */
  render(value: unknown): ChatNode[];
  /** A number unique within this card, for action ids. */
  nextActionIndex(): number;
}

/** The `component` of an OpenUI component definition in a Chat SDK library. */
export type ChatComponentRenderer = (
  props: Record<string, unknown>,
  ctx: ChatRenderContext,
) => ChatNode | null;

export type ChatLibrary = Library<ChatComponentRenderer>;

export interface RenderCardResult {
  /** The card to post, or null when the response has no root component yet. */
  card: CardElement | null;
  /** Parser and runtime errors, for sending back to the model. */
  errors: OpenUIError[];
}

const ACTION_TYPES = new Set(["button", "link-button", "select", "radio_select"]);

/**
 * Groups loose buttons and fields into the containers a card needs:
 * buttons and selects into `Actions`, fields into `Fields`.
 */
export function toCardChildren(nodes: ChatNode[]): CardChild[] {
  const out: CardChild[] = [];
  for (const node of nodes) {
    const last = out[out.length - 1];
    if (ACTION_TYPES.has(node.type)) {
      const action = node as ButtonElement | LinkButtonElement | SelectElement | RadioSelectElement;
      if (last?.type === "actions") last.children.push(action);
      else out.push(Actions([action]));
    } else if (node.type === "field") {
      if (last?.type === "fields") last.children.push(node as FieldElement);
      else out.push(Fields([node as FieldElement]));
    } else if (node.type === "card") {
      out.push(...(node as CardElement).children);
    } else {
      out.push(node as CardChild);
    }
  }
  return out;
}

/**
 * Renders a parsed OpenUI Lang response to a Chat SDK card. Each adapter posts
 * the card in its native format: Block Kit on Slack, Adaptive Cards on Teams.
 *
 * Props are evaluated once with each `$variable` at its declared default; a
 * posted message has no live state, so `Query()` results resolve to null.
 */
export function renderCard(result: ParseResult, library: ChatLibrary): RenderCardResult {
  const errors: OpenUIError[] = result.meta.errors.length
    ? enrichErrors(result.meta.errors, library.toJSONSchema(), Object.keys(library.components))
    : [];
  let root;
  try {
    root = evaluateRoot(result, {
      ctx: {
        getState: (name) => result.stateDeclarations[name] ?? null,
        resolveRef: () => null,
      },
      library,
      store: null,
      errors,
    });
  } catch (e) {
    errors.push({
      source: "runtime",
      code: "runtime-error",
      message: `Prop evaluation failed: ${e instanceof Error ? e.message : String(e)}`,
    });
    return { card: null, errors };
  }
  if (!root) return { card: null, errors };

  let actionIndex = 0;
  const render = (value: unknown): ChatNode[] => {
    if (value == null) return [];
    if (Array.isArray(value)) return value.flatMap(render);
    if (typeof value === "string") return value.trim() ? [CardText(value)] : [];
    if (!isElementNode(value)) return [];
    const def = library.components[value.typeName];
    if (!def) return [];
    const node = def.component(value.props, {
      partial: value.partial,
      render,
      nextActionIndex: () => actionIndex++,
    });
    return node ? [node] : [];
  };

  const [top] = render(root);
  if (!top) return { card: null, errors };
  const card =
    top.type === "card" ? (top as CardElement) : Card({ children: toCardChildren([top]) });
  return { card, errors };
}
