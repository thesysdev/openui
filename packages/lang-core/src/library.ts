import { z } from "zod";
import { generatePrompt } from "./parser/prompt";

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

// ─── Renderer types (framework-generic) ──────────────────────────────────────

/**
 * The props passed to every component renderer.
 *
 * Framework adapters narrow `RenderNode`:
 * - React:  RenderNode = ReactNode
 * - Svelte: RenderNode = Snippet<[unknown]>
 * - Vue:    RenderNode = VNode
 */
export interface ComponentRenderProps<P = Record<string, unknown>, RenderNode = unknown> {
  props: P;
  renderNode: (value: unknown) => RenderNode;
}

// ─── DefinedComponent (framework-generic) ────────────────────────────────────

/**
 * A fully defined component. The `C` parameter represents the
 * framework-specific component/renderer type. lang-core never
 * inspects this value — it is stored opaquely and consumed
 * by the framework adapter's Renderer.
 */
export interface DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>, C = unknown> {
  name: string;
  props: T;
  description: string;
  component: C;
  /** Use in parent schemas: `z.array(ChildComponent.ref)` */
  ref: z.ZodType<SubComponentOf<z.infer<T>>>;
}

/**
 * Define a component with name, schema, description, and renderer.
 * Registers the Zod schema globally and returns a `.ref` for parent schemas.
 */
export function defineComponent<T extends z.ZodObject<any>, C>(config: {
  name: string;
  props: T;
  description: string;
  component: C;
}): DefinedComponent<T, C> {
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

export interface Library<C = unknown> {
  readonly components: Record<string, DefinedComponent<any, C>>;
  readonly componentGroups: ComponentGroup[] | undefined;
  readonly root: string | undefined;

  prompt(options?: PromptOptions): string;
  toJSONSchema(): object;
}

export interface LibraryDefinition<C = unknown> {
  components: DefinedComponent<any, C>[];
  componentGroups?: ComponentGroup[];
  root?: string;
}

/**
 * Create a component library from an array of defined components.
 */
export function createLibrary<C = unknown>(input: LibraryDefinition<C>): Library<C> {
  const componentsRecord: Record<string, DefinedComponent<any, C>> = {};
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

  const library: Library<C> = {
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
