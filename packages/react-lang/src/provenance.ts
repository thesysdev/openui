const SOURCE = "data-openui-source";
const PROP = "data-openui-prop";

/** Data attributes that mark an element as showing a component, or one of its props. */
export interface SourceBinding {
  "data-openui-source"?: string;
  "data-openui-prop"?: string;
}

/**
 * Marks the DOM a component renders, for "where did this come from": `bindSource()` on its root
 * element, `bindSource("value")` on the element that shows that prop. Spread the result onto the
 * element.
 */
export type BindSource<P = Record<string, unknown>> = (
  prop?: Extract<keyof P, string>,
) => SourceBinding;

/** The component, and prop, a click landed on. */
export interface SourceTarget {
  /** The component's statement, or its inline id (`lead.1`) when it is written inside one. */
  statementId: string;
  /** The prop whose element was clicked, when the component marks it with `bindSource("prop")`. */
  prop?: string;
  /** The component's root: its `bindSource()` element, or else its first element. */
  element: Element;
  /** The clicked prop's element. */
  propElement?: Element;
}

const NONE: SourceBinding = Object.freeze({});

export function createBindSource(statementId: string | undefined): BindSource<any> {
  if (!statementId) return () => NONE;
  const root: SourceBinding = Object.freeze({ [SOURCE]: statementId });
  return (prop) => (prop === undefined ? root : { [SOURCE]: statementId, [PROP]: prop });
}

/** Renderer's per-element mount component, so a fiber walk can recognize it. */
export const renderNodeTypes = new WeakSet<object>();

/** An element, also from another frame (an iframe has its own `Element`). */
const isElement = (value: unknown): value is Element => (value as Node | null)?.nodeType === 1;

/** The nearest element marked for `statementId`: its root (no prop) or any of its props. */
function closestBound(from: Element, statementId: string, prop: boolean): Element | undefined {
  for (let el: Element | null = from; el; el = el.parentElement) {
    if (el.getAttribute(SOURCE) === statementId && el.hasAttribute(PROP) === prop) return el;
  }
  return undefined;
}

/**
 * The component, and prop, under a clicked element, for an inspect mode. It walks React's tree up
 * to the nearest component that has a statement, so a component without `bindSource()` is found
 * too, as is content it renders into a portal. Without React's internals it reads the
 * `bindSource` attributes only. Null when no component is found.
 *
 * `boundary` is the element of the UI that owns the inspect mode: a component above it, such as
 * one that renders that UI inside another `Renderer`, is not returned.
 */
export function readSourceTarget(
  target: EventTarget | null,
  boundary?: Element | null,
): SourceTarget | null {
  const start = isElement(target) ? target : ((target as Node | null)?.parentElement ?? null);
  if (!start) return null;
  const node = nearestRenderedComponent(start, boundary);
  if (node === "boundary") return null;
  if (!node) return readFromAttributes(start, boundary);
  const propElement = closestBound(start, node.statementId, true);
  const root = closestBound(start, node.statementId, false);
  const element = root ?? node.firstElement ?? propElement;
  if (!element) return null;
  return {
    statementId: node.statementId,
    prop: propElement?.getAttribute(PROP) ?? undefined,
    element,
    propElement,
  };
}

function readFromAttributes(start: Element, boundary?: Element | null): SourceTarget | null {
  const bound = start.closest(`[${SOURCE}]`);
  const statementId = bound?.getAttribute(SOURCE);
  // A marked element around the boundary belongs to an outer UI; inside it, or portaled out of it
  // (renderInHtmlElement), it belongs to this one.
  if (!bound || !statementId || (boundary && bound.contains(boundary))) return null;
  const isProp = bound.hasAttribute(PROP);
  return {
    statementId,
    prop: isProp ? (bound.getAttribute(PROP) ?? undefined) : undefined,
    element: (isProp && closestBound(bound, statementId, false)) || bound,
    propElement: isProp ? bound : undefined,
  };
}

// ─── React internals (undocumented; unchanged since React 17) ────────────────
// Every read is guarded: if React's shape changes, the walk finds nothing and the attributes win.

interface Fiber {
  type: unknown;
  alternate: Fiber | null;
  return: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  stateNode: unknown;
  memoizedProps: unknown;
}

/** The fiber of the nearest element React created. A chart library's own SVG has none. */
function fiberOf(start: Element): Fiber | null {
  for (let el: Element | null = start; el; el = el.parentElement) {
    const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
    const fiber = key ? (el as unknown as Record<string, Fiber | undefined>)[key] : undefined;
    if (fiber) return currentOf(fiber);
  }
  return null;
}

/**
 * A DOM node keeps the fiber it was created with, which after an update can be the previous
 * render's copy. Its tree leads to the root that is not current; then the other copy is current.
 */
function currentOf(fiber: Fiber): Fiber {
  let top = fiber;
  while (top.return) top = top.return;
  const root = top.stateNode as { current?: unknown } | null;
  return root && root.current !== top && fiber.alternate ? fiber.alternate : fiber;
}

function nearestRenderedComponent(
  start: Element,
  boundary?: Element | null,
): { statementId: string; firstElement?: Element } | "boundary" | null {
  for (let fiber = fiberOf(start); fiber; fiber = fiber.return) {
    if (boundary && fiber.stateNode === boundary) return "boundary";
    if (!renderNodeTypes.has(fiber.type as object)) continue;
    const el = (fiber.memoizedProps as { el?: { statementId?: string; inlineId?: string } } | null)
      ?.el;
    const statementId = el?.statementId ?? el?.inlineId;
    if (statementId) return { statementId, firstElement: firstElement(fiber) };
  }
  return null;
}

/** The first DOM element a component renders. */
function firstElement(fiber: Fiber): Element | undefined {
  for (let child = fiber.child; child; child = child.sibling) {
    if (isElement(child.stateNode)) return child.stateNode;
    const found = firstElement(child);
    if (found) return found;
  }
  return undefined;
}
