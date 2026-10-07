import type * as z from "zod/v4/core";
import { assertV4Schema } from "./signature";

function assertParamsObject(params: z.$ZodType, name: string): void {
  assertV4Schema(params, name);
  if (params?._zod?.def.type !== "object") {
    throw new Error(`[OpenUI] "${name}" params must be a z.object().`);
  }
}

/** defineFunction({name: "Percent", params, fn}) -> called as @Percent(done, total) */
export interface DefinedFunction<
  T extends z.$ZodObject = z.$ZodObject,
  R extends z.$ZodType | undefined = z.$ZodType | undefined,
> {
  name: string;
  description: string;
  /** z.object({part, total}) -> @Percent(part, total), in key order */
  params: T;
  /** z.string() -> the return type in the prompt signature, checked at runtime */
  returns?: R;
  /** `@Percent(3, 4)` -> fn({part: 3, total: 4}); bad args or result, or a throw -> null */
  fn: (args: z.infer<T>) => R extends z.$ZodType ? z.infer<R> : unknown;
}

/** createLibrary({ functions: [defineFunction({name: "Percent", ...})] }) */
export function defineFunction<
  T extends z.$ZodObject,
  R extends z.$ZodType | undefined = undefined,
>(config: DefinedFunction<T, R>): DefinedFunction<T, R> {
  assertParamsObject(config.params, config.name);
  if (config.returns) assertV4Schema(config.returns, config.name);
  return config;
}

/** A library action step, delivered to `onAction` as `{ type: name, params }` on click. */
export interface DefinedAction<T extends z.$ZodObject = z.$ZodObject, N extends string = string> {
  name: N;
  description: string;
  /** Parameters as a Zod object. Key order is the positional order in programs. */
  params: T;
}

/** Define a library action for `createLibrary({ actions })`. */
export function defineAction<const N extends string, T extends z.$ZodObject>(
  config: DefinedAction<T, N>,
): DefinedAction<T, N> {
  assertParamsObject(config.params, config.name);
  return config;
}
