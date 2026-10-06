import type * as z from "zod/v4/core";
import { assertV4Schema } from "./signature";

function assertParamsObject(params: z.$ZodType, name: string): void {
  assertV4Schema(params, name);
  if (params?._zod?.def.type !== "object") {
    throw new Error(`[OpenUI] "${name}" params must be a z.object().`);
  }
}

/** A library function, called like a built-in: `@Percent(done, total)`. */
export interface DefinedFunction<
  T extends z.$ZodObject = z.$ZodObject,
  R extends z.$ZodType | undefined = z.$ZodType | undefined,
> {
  name: string;
  description: string;
  /** Parameters as a Zod object. Key order is the positional order in programs. */
  params: T;
  /** Return value schema, shown in the prompt and checked at runtime. */
  returns?: R;
  /** Gets the args as one object with defaults applied. Invalid args or results, or a throw, give null. */
  fn: (args: z.infer<T>) => R extends z.$ZodType ? z.infer<R> : unknown;
}

/** Define a library function for `createLibrary({ functions })`. */
export function defineFunction<
  T extends z.$ZodObject,
  R extends z.$ZodType | undefined = undefined,
>(config: DefinedFunction<T, R>): DefinedFunction<T, R> {
  assertParamsObject(config.params, config.name);
  if (config.returns) assertV4Schema(config.returns, config.name);
  return config;
}
