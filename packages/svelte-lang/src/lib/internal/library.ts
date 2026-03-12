import { z } from "zod";
import { generatePrompt } from "./parser/prompt";

export type SubComponentOf<P> = {
  type: "element";
  typeName: string;
  props: P;
  partial: boolean;
};

export interface ComponentDefinition<T extends z.ZodObject<any> = z.ZodObject<any>> {
  name: string;
  props: T;
  description: string;
  ref: z.ZodType<SubComponentOf<z.infer<T>>>;
}

export interface DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>>
  extends ComponentDefinition<T> {}

export function defineComponent<T extends z.ZodObject<any>>(config: {
  name: string;
  props: T;
  description: string;
}): DefinedComponent<T> {
  (config.props as any).register(z.globalRegistry, { id: config.name });
  return {
    ...config,
    ref: config.props as unknown as z.ZodType<SubComponentOf<z.infer<T>>>,
  };
}

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

export interface Library<
  TComponent extends ComponentDefinition = DefinedComponent,
> {
  readonly components: Record<string, TComponent>;
  readonly componentGroups: ComponentGroup[] | undefined;
  readonly root: string | undefined;

  prompt(options?: PromptOptions): string;
  toJSONSchema(): object;
}

export interface LibraryDefinition<
  TComponent extends ComponentDefinition = DefinedComponent,
> {
  components: TComponent[];
  componentGroups?: ComponentGroup[];
  root?: string;
}

export function createLibrary<
  TComponent extends ComponentDefinition,
>(input: LibraryDefinition<TComponent>): Library<TComponent> {
  const componentsRecord: Record<string, TComponent> = {};
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

  const library: Library<TComponent> = {
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
