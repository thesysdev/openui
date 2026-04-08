import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
  type DefinedComponent as CoreDefinedComponent,
  type Library as CoreLibrary,
  type LibraryDefinition as CoreLibraryDefinition,
  type ComponentRenderProps as CoreRenderProps,
} from "@openuidev/lang-core";
import type { JSX } from "solid-js";
import { z } from "zod";

export type {
  ComponentGroup,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "@openuidev/lang-core";

export type ComponentRenderProps<P = Record<string, unknown>> = CoreRenderProps<P, JSX.Element>;

export type ComponentRenderer<P = Record<string, unknown>> = (
  props: ComponentRenderProps<P>,
) => JSX.Element;

export type DefinedComponent<T extends z.ZodObject<any> = z.ZodObject<any>> = CoreDefinedComponent<
  T,
  ComponentRenderer<z.infer<T>>
>;

export type Library = CoreLibrary<ComponentRenderer<any>>;

export type LibraryDefinition = CoreLibraryDefinition<ComponentRenderer<any>>;

export function defineComponent<T extends z.ZodObject<any>>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>(config);
}

export function createLibrary(input: LibraryDefinition): Library {
  return coreCreateLibrary<ComponentRenderer<any>>(input) as Library;
}
