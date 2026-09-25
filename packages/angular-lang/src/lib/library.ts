import type { Type } from "@angular/core";
import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
  type ComponentRenderProps as CoreComponentRenderProps,
  type DefinedComponent as CoreDefinedComponent,
  type Library as CoreLibrary,
  type LibraryDefinition as CoreLibraryDefinition,
} from "@openuidev/lang-core";
import type { $ZodObject } from "zod/v4/core";

export type {
  ComponentGroup,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "@openuidev/lang-core";

export interface ComponentRenderProps<P = Record<string, unknown>> extends CoreComponentRenderProps<
  P,
  unknown
> {}

/**
 * Angular component type registered in an OpenUI library.
 *
 * The runtime treats this value opaquely and instantiates it through Angular's
 * dynamic component APIs. The package does not require the component instance
 * to implement a specific interface at the type level during v0.1.
 */
export type ComponentRenderer = Type<unknown>;

export type DefinedComponent<T extends $ZodObject = $ZodObject> = CoreDefinedComponent<
  T,
  ComponentRenderer
>;

export type Library = CoreLibrary<ComponentRenderer>;

export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer>;

/**
 * Define a single Angular-rendered OpenUI component.
 */
export function defineComponent<T extends $ZodObject>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer;
}): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer>(config);
}

/**
 * Create an Angular OpenUI component library.
 */
export function createLibrary(input: LibraryDefinition): Library {
  return coreCreateLibrary<ComponentRenderer>(input) as Library;
}
