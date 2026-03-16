import type { Component, Snippet } from "svelte";
import { z } from "zod";
import {
	createLibrary as coreCreateLibrary,
	defineComponent as coreDefineComponent,
	type ComponentRenderProps as CoreRenderProps,
	type DefinedComponent as CoreDefinedComponent,
	type Library as CoreLibrary,
	type LibraryDefinition as CoreLibraryDefinition,
} from "@openuidev/lang-core";

// Re-export framework-agnostic types unchanged
export type { ComponentGroup, PromptOptions, SubComponentOf } from "@openuidev/lang-core";

// ─── Svelte-specific types ──────────────────────────────────────────────────

export interface ComponentRenderProps<P = Record<string, unknown>>
	extends CoreRenderProps<P, Snippet<[unknown]>> {}

export type ComponentRenderer<P = Record<string, unknown>> = Component<ComponentRenderProps<P>>;

export type DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>> =
	CoreDefinedComponent<T, ComponentRenderer<z.infer<T>>>;

export type Library = CoreLibrary<ComponentRenderer<any>>;

export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer<any>>;

// ─── defineComponent (Svelte) ───────────────────────────────────────────────

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
 *   component: TabItemRenderer,
 * });
 * ```
 */
export function defineComponent<T extends z.ZodObject<any>>(config: {
	name: string;
	props: T;
	description: string;
	component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
	return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>(config);
}

// ─── createLibrary (Svelte) ─────────────────────────────────────────────────

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
