import { readSourceTarget, type DataSources, type SourceTarget } from "@openuidev/react-lang";
import { componentLabel } from "../SourcesContents/describe";
import { sourceIndex } from "../SourcesContents/sourceIndex";

/** On each data-bound component's outlined element while inspecting: the component's id. */
export const BOUND = "data-openui-bound";
const SOURCE = "data-openui-source";
const PROP = "data-openui-prop";

/** What can take focus without a tabindex of its own. */
const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex], [contenteditable]";

/** What a click, Enter or Space on each outlined element picks. */
const targets = new WeakMap<Element, SourceTarget>();

/** The data-bound component an event landed on: the outlined element around it, if any. */
export function boundTarget(from: EventTarget | null): SourceTarget | null {
  const bound = (from as Element | null)?.closest?.(`[${BOUND}]`);
  return (bound && targets.get(bound)) ?? null;
}

/** Each component that renders an element, with that element, and each marked prop's element. */
function scan(areas: Element[], boundary: Element | null) {
  const components = new Map<string, Element>();
  const props = new Map<string, Element>();
  for (const area of areas) {
    for (const element of area.querySelectorAll("*")) {
      const source = element.getAttribute(SOURCE);
      const prop = element.getAttribute(PROP);
      if (source && prop) {
        const key = `${source}\u0000${prop}`;
        if (!props.has(key)) props.set(key, element);
      }
      const target = readSourceTarget(element, boundary);
      if (target && !components.has(target.id)) components.set(target.id, target.element);
    }
  }
  return { components, props };
}

/**
 * Each data-bound component's outlined element, whether or not inspect mode marks it: the element
 * of its prop that shows the value when the component marks one, else the component's own.
 */
function boundElements(areas: Element[], boundary: Element | null, sources: DataSources | null) {
  const found = new Map<Element, { target: SourceTarget; label: string }>();
  if (!sources) return found;
  const { components, props } = scan(areas, boundary);
  const index = sourceIndex(sources, { renders: (id) => components.has(id) });
  for (const { id, props: read } of index.components.values()) {
    const element = components.get(id);
    if (!element) continue;
    const prop = read.find((name) => props.has(`${id}\u0000${name}`));
    const propElement = prop ? props.get(`${id}\u0000${prop}`) : undefined;
    const anchor = propElement ?? element;
    if (found.has(anchor)) continue;
    found.set(anchor, {
      target: { id, prop, element, propElement },
      label: componentLabel(sources, id) ?? id,
    });
  }
  return found;
}

/** The ids of the components that render an element of their own in `areas`. */
export function renderedComponents(areas: Element[], boundary: Element | null): Set<string> {
  return new Set(scan(areas, boundary).components.keys());
}

/** The data-bound component `id` as inspect mode would pick it, found with or without its marks. */
export function findBoundTarget(
  areas: Element[],
  boundary: Element | null,
  sources: DataSources | null,
  id: string,
): SourceTarget | null {
  for (const { target } of boundElements(areas, boundary, sources).values()) {
    if (target.id === id) return target;
  }
  return null;
}

/**
 * Outlines what inspect mode can pick: each data-bound component of the program (see
 * `sourceIndex`), on the element of its prop that shows the value when the component marks one
 * with `bindSource("value")`, else on the component's own element. That element gets `BOUND`,
 * and, unless it takes focus already, a place in the tab order as a button named by the
 * component's label. `update` follows the DOM and the sources as they change; `clear` gives every
 * element back what it had.
 */
export function createInspectMarks(boundary: Element | null) {
  /** Each outlined element, and how to give it back what it had. */
  const marked = new Map<Element, () => void>();

  function mark(element: Element, id: string, label: string) {
    element.setAttribute(BOUND, id);
    if (element.matches(FOCUSABLE)) return () => element.removeAttribute(BOUND);
    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.setAttribute("aria-haspopup", "dialog");
    element.setAttribute("aria-label", label);
    return () => {
      for (const name of [BOUND, "tabindex", "role", "aria-haspopup", "aria-label"]) {
        element.removeAttribute(name);
      }
    };
  }

  function update(areas: Element[], sources: DataSources | null) {
    const next = boundElements(areas, boundary, sources);
    for (const [element, restore] of marked) {
      const now = next.get(element);
      if (now && element.getAttribute(BOUND) === now.target.id) continue;
      restore();
      marked.delete(element);
    }
    for (const [element, { target, label }] of next) {
      targets.set(element, target);
      if (!marked.has(element)) marked.set(element, mark(element, target.id, label));
      else if (element.getAttribute("role") === "button") element.setAttribute("aria-label", label);
    }
  }

  function clear() {
    for (const restore of marked.values()) restore();
    marked.clear();
  }

  return { update, clear };
}
