import {
  createLibrary as coreCreateLibrary,
  defineComponent as coreDefineComponent,
  type DefinedComponent as CoreDefinedComponent,
  type Library as CoreLibrary,
  type LibraryDefinition as CoreLibraryDefinition,
  type LibraryExtension as CoreLibraryExtension,
  type ComponentRenderProps as CoreRenderProps,
  type DefinedAction,
} from "@openuidev/lang-core";
import type { ReactNode } from "react";
import type { z } from "zod/v4";
import type { $ZodObject } from "zod/v4/core";
import { libraryKey, publishLibrary } from "./publishLibrary";

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

export type LibraryExtension<A extends AnyAction = AnyAction> = CoreLibraryExtension<
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

export function createLibrary<A extends AnyAction = never>(
  input: LibraryDefinition<A>,
): Library<A> {
  return published(coreCreateLibrary<ComponentRenderer<any>, A>(input));
}

let extendCount = 0;

// Dev-only devtools registration. Each derived library gets its own key so it
// does not replace its base or a sibling.
function published<A extends AnyAction>(
  library: Library<A>,
  key = libraryKey(library),
): Library<A> {
  if (process.env["NODE_ENV"] !== "production") {
    publishLibrary(library, key);
  }
  const extend = library.extend;
  return Object.assign(library, {
    extend: ((ext) =>
      published(extend(ext), `${key}:extend-${++extendCount}`)) as Library<A>["extend"],
  });
}
