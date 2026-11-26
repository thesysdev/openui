import type { DataSourceQuery, DataSources } from "@openuidev/react-lang";

type PropSources = DataSources["components"][string]["props"][string];

/** A rendered component whose value comes from a query, directly or through a formula. */
export interface DataBoundComponent {
  /** Its statement name, or its component id (`lead.1`). */
  id: string;
  /**
   * The props that read data, named as in the library, e.g. `value`. Where the component marks
   * one with `bindSource("value")`, that element shows the value.
   */
  props: string[];
  /** The names of the sources it reads: its formulas, then its queries. */
  sources: string[];
}

/** One query (a data tool call) or one formula that a data-bound component reads. */
export type Source = {
  /** Its statement name, e.g. `revenueQ` or `grossMargin`. */
  name: string;
  /** The data-bound components that read it, in program order. */
  usedBy: string[];
} & (
  | { kind: "query"; /** Its call, loading flag and result. */ query: DataSourceQuery }
  | { kind: "formula"; /** The statement as written, e.g. `@First(revenueQ.rows)`. */ text: string }
);

/** What has sources in a program, and what they are. */
export interface SourceIndex {
  /** The data-bound components, by id, in program order. */
  components: ReadonlyMap<string, DataBoundComponent>;
  /** Every source a data-bound component reads, by name: the queries, then the formulas. */
  sources: ReadonlyMap<string, Source>;
}

/** Which components render an element of their own. Default: every one. */
export interface SourceIndexOptions {
  /**
   * Whether a component renders an element, e.g. whether one carries its `data-openui-source`.
   * One that renders nothing, such as a table's `Col`, hands what it reads to the component it
   * is written in.
   */
  renders?: (id: string) => boolean;
}

const readsData = (prop: PropSources) => prop.queries.length > 0;
const unique = (names: string[]) => [...new Set(names)];

/**
 * What has sources in a program, from its provenance (`useArtifactProvenance().sources`).
 *
 * A component is data-bound when one of its own props reads a query, directly or through a
 * formula. A layout container, whose props only hold other components, is not, even when its
 * children are: they are data-bound themselves. A child that renders nothing (see `renders`) is the exception:
 * the nearest component around it that renders reads its data, as a table reads its columns'.
 * Headings, text and props written as literals read no query, so they are never data-bound.
 */
export function sourceIndex(sources: DataSources, options: SourceIndexOptions = {}): SourceIndex {
  const renders = options.renders ?? (() => true);
  const all = sources.components;

  // Each component's parent, and the parent's prop it is written in.
  const parents = new Map<string, { id: string; prop: string }>();
  for (const [id, component] of Object.entries(all)) {
    for (const [prop, each] of Object.entries(component.props)) {
      for (const child of each.components)
        if (!parents.has(child)) parents.set(child, { id, prop });
    }
  }
  // Where a component's data shows: itself, or the nearest rendered component around it.
  const shownBy = (id: string): { id: string; prop?: string } | undefined => {
    let at: { id: string; prop?: string } = { id };
    for (const seen = new Set<string>(); !renders(at.id);) {
      if (seen.has(at.id)) return undefined;
      seen.add(at.id);
      const parent = parents.get(at.id);
      if (!parent) return undefined;
      at = { id: parent.id, prop: at.prop ?? parent.prop };
    }
    return at;
  };

  // What each data-bound component reads, by prop, in program order.
  const reads = new Map<string, Map<string, PropSources[]>>();
  for (const [id, component] of Object.entries(all)) {
    for (const [prop, each] of Object.entries(component.props)) {
      if (!readsData(each)) continue;
      const shown = shownBy(id);
      if (!shown) continue;
      const byProp = reads.get(shown.id) ?? new Map<string, PropSources[]>();
      reads.set(shown.id, byProp);
      const key = shown.prop ?? prop;
      byProp.set(key, [...(byProp.get(key) ?? []), each]);
    }
  }

  const components = new Map<string, DataBoundComponent>();
  for (const id of Object.keys(all)) {
    const byProp = reads.get(id);
    if (!byProp) continue;
    const read = [...byProp.values()].flat();
    const queries = unique(read.flatMap((prop) => prop.queries)).filter(
      (n) => n in sources.queries,
    );
    const formulas = unique(read.flatMap((prop) => prop.via)).filter((n) => n in sources.formulas);
    components.set(id, { id, props: [...byProp.keys()], sources: [...formulas, ...queries] });
  }

  const usedBy = (name: string) =>
    [...components.values()].filter((each) => each.sources.includes(name)).map((each) => each.id);
  const listed = new Map<string, Source>();
  for (const [name, query] of Object.entries(sources.queries)) {
    const users = usedBy(name);
    if (users.length) listed.set(name, { name, kind: "query", query, usedBy: users });
  }
  for (const [name, text] of Object.entries(sources.formulas)) {
    const users = usedBy(name);
    if (users.length) listed.set(name, { name, kind: "formula", text, usedBy: users });
  }
  return { components, sources: listed };
}
