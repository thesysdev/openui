/**
 * The generic tree walker. Walks a RESOLVED lang-core ElementNode tree and
 * dispatches each node to its component's own render function (stored in the
 * component's `component` slot, which lang-core treats as opaque — the same
 * extension point react-lang uses for React components).
 *
 * Recursion is component-driven: the walker never descends into props itself;
 * a component calls ctx.walk(children) for children it renders, or reads child
 * props directly for children it consumes as data (e.g. Select reading Options).
 *
 * The walk collects the cross-platform interaction contract:
 *   - actionMap: id -> ActionEntry (run a plan, or set a bound $variable)
 *   - charts:    chart requests for the transport to rasterize and deliver
 *   - forms:     form id -> FormSpec for the platform's form surface
 */
import type { ElementNode, Library } from "@openuidev/lang-core";
import { defineComponent, isReactiveAssign } from "@openuidev/lang-core";
import type { ChartSpec, FormSpec } from "../ui/types";
import type { ActionEntry, RenderFn, Snapshot, WalkCtx } from "./types";

/** Define a component whose `component` slot holds its platform render function. */
export function defineBlockComponent(config: {
  name: string;
  props: any;
  description: string;
  render: RenderFn;
}) {
  return defineComponent({
    name: config.name,
    props: config.props,
    description: config.description,
    component: config.render,
  });
}

export type WalkResult = {
  items: unknown[];
  actionMap: Record<string, ActionEntry>;
  charts: ChartSpec[];
  forms: Record<string, FormSpec>;
};

const isElement = (n: unknown): n is ElementNode =>
  !!n && typeof n === "object" && (n as any).type === "element";

/** Walk a resolved tree, dispatching to each component's render function. */
export function walkTree(
  root: ElementNode,
  library: Library<RenderFn>,
  state: Snapshot,
): WalkResult {
  const actionMap: Record<string, ActionEntry> = {};
  const charts: ChartSpec[] = [];
  const forms: Record<string, FormSpec> = {};
  const counters: Record<string, number> = {};

  const walk = (children: unknown): unknown[] => {
    if (Array.isArray(children)) return children.flatMap(walk);
    if (!isElement(children)) return [];
    const def = library.components[children.typeName];
    if (!def || typeof def.component !== "function") return [];
    return (def.component as RenderFn)({ props: children.props ?? {}, node: children, ctx });
  };

  const ctx: WalkCtx = {
    state,
    walk,
    idFor(node, prefix = "el") {
      if (node.statementId) return node.statementId;
      const n = counters[prefix] ?? 0;
      counters[prefix] = n + 1;
      return `${prefix}_${n}`;
    },
    bindTarget: (v) => (isReactiveAssign(v) ? (v as any).target : undefined),
    registerAction(id, entry) {
      actionMap[id] = entry;
    },
    addChart(spec) {
      const id = `chart_${charts.length}`;
      charts.push({ id, ...spec });
      return id;
    },
    registerForm(id, spec) {
      forms[id] = spec;
    },
  };

  return { items: walk(root), actionMap, charts, forms };
}
