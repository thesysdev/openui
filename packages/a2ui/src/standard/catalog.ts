import type { LibraryJSONSchema } from "@openuidev/lang-core";

/**
 * The A2UI Basic Catalog's functions, with their arguments in catalog order
 * (the same in v0.9 and v1.0). A2UI Express writes a call as
 * `formatDate($/event/date, "MMM d")`; OpenUI Lang writes functions with `@`,
 * as `@formatDate($event.date, "MMM d")`. Either way the arguments are filled
 * positionally.
 */
export const BASIC_CATALOG_FUNCTIONS: Readonly<Record<string, readonly string[]>> = {
  required: ["value"],
  regex: ["value", "pattern"],
  length: ["value", "min", "max"],
  numeric: ["value", "min", "max"],
  email: ["value"],
  formatString: ["value"],
  formatNumber: ["value", "decimals", "grouping"],
  formatCurrency: ["value", "currency", "decimals", "grouping"],
  formatDate: ["value", "format"],
  pluralize: ["value", "zero", "one", "two", "few", "many", "other"],
  openUrl: ["url"],
  and: ["values"],
  or: ["values"],
  not: ["value"],
};

/** What the compiler needs to know about a catalog, read from an OpenUI library schema. */
export interface CatalogInfo {
  /** Positional prop names of each component. */
  props: Map<string, string[]>;
  /** Allowed values of each enum prop, by component. */
  enums: Map<string, Map<string, readonly string[]>>;
  /** Props that hold component ids (children, a child, tab contents). */
  childProps: Map<string, Set<string>>;
  /** Positional argument names of each catalog function. */
  functions: Map<string, readonly string[]>;
}

type SchemaNode = Record<string, unknown>;

/** Whether a prop's schema refers to another definition, i.e. holds components. */
function refersToDefinition(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  if (Array.isArray(node)) return node.some(refersToDefinition);
  if (typeof (node as SchemaNode).$ref === "string") return true;
  return Object.values(node as SchemaNode).some(refersToDefinition);
}

/**
 * Reads component prop order, enum values and component-holding props from a
 * library schema (`library.toJSONSchema()`), whose components describe the
 * A2UI catalog the renderer uses. Prop order in the schema is the positional
 * argument order in OpenUI Lang.
 */
export function readCatalog(
  schema: LibraryJSONSchema,
  functions: Readonly<Record<string, readonly string[]>> = BASIC_CATALOG_FUNCTIONS,
): CatalogInfo {
  const defs = schema.$defs ?? {};
  const names = schema.properties ? Object.keys(schema.properties) : Object.keys(defs);
  const info: CatalogInfo = {
    props: new Map(),
    enums: new Map(),
    childProps: new Map(),
    functions: new Map(Object.entries(functions)),
  };

  for (const name of names) {
    const properties = (defs[name]?.properties ?? {}) as Record<string, SchemaNode>;
    info.props.set(name, Object.keys(properties));
    const enums = new Map<string, readonly string[]>();
    const children = new Set<string>();
    for (const [prop, propSchema] of Object.entries(properties)) {
      if (Array.isArray(propSchema?.enum)) enums.set(prop, propSchema.enum as string[]);
      // A prop with no schema (`{}`) may hold components, so it is treated as one that does.
      const untyped = !propSchema || Object.keys(propSchema).length === 0;
      if (untyped || refersToDefinition(propSchema)) children.add(prop);
    }
    info.enums.set(name, enums);
    info.childProps.set(name, children);
  }

  // Functions the library itself defines keep their declared parameter order.
  for (const [name, fn] of Object.entries(schema.functions ?? {})) {
    info.functions.set(name, Object.keys(fn.params?.properties ?? {}));
  }
  return info;
}
