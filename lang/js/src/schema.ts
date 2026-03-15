import { z } from "zod";
import type { Model } from "./defineModel";
import { collectModels } from "./utils/collectModels";
import { compileSchema, createStreamParser, parse, type ZodSchemaMap } from "./parser/core";
import { generatePrompt, type PromptOptions } from "./parser/prompt";
import type { ParseResult, StreamingParser } from "./types";

export type { PromptOptions } from "./parser/prompt";

export interface Schema {
  readonly models: Record<string, Model>;
  readonly root: string | string[] | undefined;
  prompt(options?: PromptOptions): string;
  toJSONSchema(): object;
  parse(input: string): ParseResult<unknown>;
  streamingParser(): StreamingParser<unknown>;
}

export function createSchema(rootModels: Model[]): Schema {
  const allModels = collectModels(rootModels);

  const modelsRecord: Record<string, Model> = {};
  for (const m of allModels) {
    if (!z.globalRegistry.has(m.schema)) {
      (m.schema as any).register(z.globalRegistry, { id: m.name, description: m.description });
    }
    modelsRecord[m.name] = m;
  }

  const root: string | string[] | undefined =
    rootModels.length === 0
      ? undefined
      : rootModels.length === 1
        ? rootModels[0].name
        : rootModels.map((m) => m.name);

  const combinedSchema = z.object(
    Object.fromEntries(Object.entries(modelsRecord).map(([k, v]) => [k, v.schema])) as any,
  );
  const jsonSchema = z.toJSONSchema(combinedSchema);
  const paramMap = compileSchema(jsonSchema as any);

  const zodSchemas: ZodSchemaMap = {};
  for (const [name, def] of Object.entries(modelsRecord)) {
    zodSchemas[name] = def.schema;
  }

  const schema: Schema = {
    models: modelsRecord,
    root,

    prompt(options?: PromptOptions): string {
      return generatePrompt(
        {
          models: modelsRecord,
          root,
        },
        options,
      );
    },

    toJSONSchema(): object {
      return jsonSchema;
    },

    parse(inputText: string): ParseResult<unknown> {
      return parse(inputText, paramMap, zodSchemas);
    },

    streamingParser(): StreamingParser<unknown> {
      return createStreamParser(paramMap, zodSchemas);
    },
  };

  return schema;
}
