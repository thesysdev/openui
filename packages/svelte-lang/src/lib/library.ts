import {
  createLibrary as createCoreLibrary,
  defineComponent as defineCoreComponent,
} from "./internal";
import type {
  ComponentDefinition as CoreComponentDefinition,
  ComponentGroup,
  Library as CoreLibrary,
  LibraryDefinition as CoreLibraryDefinition,
  PromptOptions,
  SubComponentOf,
} from "./internal";
import type { Component } from "svelte";
import { z } from "zod";

export interface ComponentRenderProps<P = Record<string, unknown>> {
  props: P;
  renderNode: Component<{ value: unknown }>;
}

export type ComponentRenderer<P = Record<string, unknown>> = Component<ComponentRenderProps<P>>;

export interface DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>>
  extends CoreComponentDefinition<T> {
  component: ComponentRenderer<z.infer<T>>;
}

export interface Library extends CoreLibrary<DefinedComponent> {}

export interface LibraryDefinition extends CoreLibraryDefinition<DefinedComponent> {}

export function defineComponent<T extends z.ZodObject<any>>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  const { component, ...coreConfig } = config;
  return {
    ...defineCoreComponent(coreConfig),
    component,
  };
}

export function createLibrary(input: LibraryDefinition): Library {
  return createCoreLibrary(input) as Library;
}

export type { ComponentGroup, PromptOptions, SubComponentOf };
