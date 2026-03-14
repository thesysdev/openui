import type { Component, Snippet } from "svelte";
import { z } from "zod";
import { generatePrompt } from "./parser/prompt.js";

// ─── Sub-component type ──────────────────────────────────────────────────────

/**
 * Runtime shape of a parsed sub-component element as seen by parent renderers.
 */
export type SubComponentOf<P> = {
  type: "element";
  typeName: string;
  props: P;
  partial: boolean;
};

// ─── Renderer types ───────────────────────────────────────────────────────────

export interface ComponentRenderProps<P = Record<string, unknown>> {
  props: P;
  renderNode: (value: unknown) => Snippet;
}

/**
 * A Svelte component that receives ComponentRenderProps as its props.
 * This is the type for user-defined component renderers.
 */
export type ComponentRenderer<P = Record<string, unknown>> = Component<ComponentRenderProps<P>>;

// ─── DefinedComponent ─────────────────────────────────────────────────────────

/**
 * A fully defined component with name, schema, description, renderer,
 * and a `.ref` for type-safe cross-referencing in parent schemas.
 */
export interface DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
  /** Use in parent schemas: `z.array(ChildComponent.ref)` */
  ref: z.ZodType<SubComponentOf<z.infer<T>>>;
}

/**
 * Define a component with name, schema, description, and renderer.
 * Registers the Zod schema globally and returns a `.ref` for parent schemas.
 *
 * @example
 * ```ts
 * const TabItem = defineComponent({
 *   name: "TabItem",
 *   props: z.object({ value: z.string(), trigger: z.string(), content: z.array(ContentChildUnion) }),
 *   description: "Tab panel",
 *   component: TabItemComponent,
 * });
 *
 * const Tabs = defineComponent({
 *   name: "Tabs",
 *   props: z.object({ items: z.array(TabItem.ref) }),
 *   description: "Tabbed container",
 *   component: TabsComponent,
 * });
 * ```
 */
export function defineComponent<T extends z.ZodObject<any>>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  (config.props as any).register(z.globalRegistry, { id: config.name });
  return {
    ...config,
    ref: config.props as unknown as z.ZodType<SubComponentOf<z.infer<T>>>,
  };
}

// ─── Groups & Prompt ──────────────────────────────────────────────────────────

export interface ComponentGroup {
  name: string;
  components: string[];
  notes?: string[];
}

export interface PromptOptions {
  preamble?: string;
  additionalRules?: string[];
  examples?: string[];
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface Library {
  readonly components: Record<string, DefinedComponent>;
  readonly componentGroups: ComponentGroup[] | undefined;
  readonly root: string | undefined;

  prompt(options?: PromptOptions): string;
  /**
   * Returns a single, valid JSON Schema document for the entire library.
   * All component schemas are in `$defs`, keyed by component name.
   */
  toJSONSchema(): object;
}

export interface LibraryDefinition {
  components: DefinedComponent[];
  componentGroups?: ComponentGroup[];
  root?: string;
}

/**
 * Create a component library from an array of defined components.
 *
 * @example
 * ```ts
 * const library = createLibrary({
 *   components: [TabItem, Tabs, Card],
 *   root: "Card",
 * });
 * ```
 */
export function createLibrary(input: LibraryDefinition): Library {
  const componentsRecord: Record<string, DefinedComponent> = {};
  for (const comp of input.components) {
    if (!z.globalRegistry.has(comp.props)) {
      comp.props.register(z.globalRegistry, { id: comp.name });
    }
    componentsRecord[comp.name] = comp;
  }

  if (input.root && !componentsRecord[input.root]) {
    const available = Object.keys(componentsRecord).join(", ");
    throw new Error(
      `[createLibrary] Root component "${input.root}" was not found in components. Available components: ${available}`,
    );
  }

  const library: Library = {
    components: componentsRecord,
    componentGroups: input.componentGroups,
    root: input.root,

    prompt(options?: PromptOptions): string {
      return generatePrompt(library, options);
    },

    toJSONSchema(): object {
      const combinedSchema = z.object(
        Object.fromEntries(Object.entries(componentsRecord).map(([k, v]) => [k, v.props])) as any,
      );
      return z.toJSONSchema(combinedSchema);
    },
  };

  return library;
}
