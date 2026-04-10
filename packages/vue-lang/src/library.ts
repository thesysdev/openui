import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
  type DefinedComponent as CoreDefinedComponent,
  type Library as CoreLibrary,
  type LibraryDefinition as CoreLibraryDefinition,
} from "@openuidev/lang-core";
import type { Component, VNode } from "vue";
import type { z } from "zod/v4";
import type { $ZodObject } from "zod/v4/core";

// Re-export framework-agnostic types unchanged
export type { ComponentGroup, PromptOptions, SubComponentOf } from "@openuidev/lang-core";

// ─── Vue-specific types ──────────────────────────────────────────────────────

export type RenderNodeResult = VNode | (VNode | string | null)[] | string | null;

export interface ComponentRenderProps<P = Record<string, unknown>> {
  props: P;
  renderNode: (value: unknown) => RenderNodeResult;
}

export type ComponentRenderer<P = Record<string, unknown>> = Component<ComponentRenderProps<P>>;

export type DefinedComponent<T extends $ZodObject = $ZodObject> = CoreDefinedComponent<
  T,
  ComponentRenderer<z.infer<T>>
>;

export type Library = CoreLibrary<ComponentRenderer<any>>;

export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer<any>>;

// ─── defineComponent (Vue) ───────────────────────────────────────────────────

/**
 * Define a component with name, schema, description, and renderer.
 * Returns a `.ref` for parent schemas.
 *
 * @example
 * ```ts
 * const TabItem = defineComponent({
 *   name: "TabItem",
 *   props: z.object({ value: z.string(), trigger: z.string(), content: z.array(ContentChildUnion) }),
 *   description: "Tab panel",
 *   component: TabItemRenderer,
 * });
 * ```
 */
export function defineComponent<T extends $ZodObject>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>(config);
}

// ─── createLibrary (Vue) ─────────────────────────────────────────────────────

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
  return coreCreateLibrary<ComponentRenderer<any>>(input) as Library;
}
