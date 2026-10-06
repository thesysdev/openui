import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
  type DefinedComponent as CoreDefinedComponent,
  type Library as CoreLibrary,
  type LibraryDefinition as CoreLibraryDefinition,
  type ComponentRenderProps as CoreRenderProps,
  type DefinedAction,
} from "@openuidev/lang-core";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import type { $ZodObject } from "zod/v4/core";
import { publishLibrary } from "./publishLibrary";

// Re-export framework-agnostic types unchanged
export type {
  ComponentGroup,
  LibraryJSONSchema,
  PromptOptions,
  SubComponentOf,
  ToolDescriptor,
} from "@openuidev/lang-core";

// ─── React-specific types ───────────────────────────────────────────────────

export interface ComponentRenderProps<P = Record<string, unknown>> extends CoreRenderProps<
  P,
  ReactNode
> {}

export type ComponentRenderer<P = Record<string, unknown>> = React.FC<ComponentRenderProps<P>>;

export type DefinedComponent<T extends $ZodObject = $ZodObject> = CoreDefinedComponent<
  T,
  ComponentRenderer<z.infer<T>>
>;

type AnyAction = DefinedAction<any, string>;

export type Library<A extends AnyAction = AnyAction> = CoreLibrary<ComponentRenderer<any>, A>;

export type LibraryDefinition<A extends AnyAction = AnyAction> = CoreLibraryDefinition<
  ComponentRenderer<any>,
  A
>;

// ─── defineComponent (React) ────────────────────────────────────────────────

export function defineComponent<T extends $ZodObject>(config: {
  name: string;
  props: T;
  description: string;
  component: ComponentRenderer<z.infer<T>>;
}): DefinedComponent<T> {
  return coreDefineComponent<T, ComponentRenderer<z.infer<T>>>(config);
}

// ─── createLibrary (React) ──────────────────────────────────────────────────

export function createLibrary<A extends AnyAction = AnyAction>(
  input: LibraryDefinition<A>,
): Library<A> {
  const library = coreCreateLibrary<ComponentRenderer<any>, A>(input);
  if (process.env["NODE_ENV"] !== "production") {
    publishLibrary(library);
  }
  return library;
}
