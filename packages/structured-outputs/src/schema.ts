import { z } from "zod";
import type { DefinedType } from "./defineType";
import { compileSchema, createStreamParser, parse, type ZodSchemaMap } from "./parser/core";
import { generatePrompt, type PromptOptions, type TypeGroup } from "./parser/prompt";
import type { ParseResult, StreamingParser } from "./types";

export type { PromptOptions, TypeGroup } from "./parser/prompt";

export interface SchemaDefinition {
  types: DefinedType<any>[];
  root?: string;
  typeGroups?: TypeGroup[];
}

export interface Schema {
  readonly types: Record<string, DefinedType>;
  readonly root: string | undefined;
  readonly typeGroups: TypeGroup[] | undefined;
  prompt(options?: PromptOptions): string;
  toJSONSchema(): object;
  parse(input: string): ParseResult<unknown>;
  streamingParser(): StreamingParser<unknown>;
}

export function createSchema(input: SchemaDefinition): Schema {
  const typesRecord: Record<string, DefinedType> = {};
  for (const t of input.types) {
    if (!z.globalRegistry.has(t.props)) {
      (t.props as any).register(z.globalRegistry, { id: t.name });
    }
    typesRecord[t.name] = t;
  }

  if (input.root && !typesRecord[input.root]) {
    const available = Object.keys(typesRecord).join(", ");
    throw new Error(
      `[createSchema] Root type "${input.root}" was not found in types. Available types: ${available}`,
    );
  }

  const combinedSchema = z.object(
    Object.fromEntries(Object.entries(typesRecord).map(([k, v]) => [k, v.props])) as any,
  );
  const jsonSchema = z.toJSONSchema(combinedSchema);
  const paramMap = compileSchema(jsonSchema as any);

  const zodSchemas: ZodSchemaMap = {};
  for (const [name, def] of Object.entries(typesRecord)) {
    zodSchemas[name] = def.props;
  }

  const schema: Schema = {
    types: typesRecord,
    typeGroups: input.typeGroups,
    root: input.root,

    prompt(options?: PromptOptions): string {
      return generatePrompt(
        {
          types: typesRecord,
          root: input.root,
          typeGroups: input.typeGroups,
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
