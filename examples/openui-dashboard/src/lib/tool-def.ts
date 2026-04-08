import type { ToolSpec } from "@openuidev/lang-core";
import type { RunnableToolFunction } from "openai/lib/RunnableFunction";
import type { JSONSchema } from "openai/lib/jsonschema";
import { z } from "zod";

interface ToolDefOptions {
  name: string;
  description: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  outputSchema: z.ZodType;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export class ToolDef {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: z.ZodObject<z.ZodRawShape>;
  readonly outputSchema: z.ZodType;
  readonly execute: (args: Record<string, unknown>) => Promise<unknown>;

  constructor(opts: ToolDefOptions) {
    this.name = opts.name;
    this.description = opts.description;
    this.inputSchema = opts.inputSchema;
    this.outputSchema = opts.outputSchema;
    this.execute = opts.execute;
  }

  /** Format accepted by `client.chat.completions.runTools()` */
  toOpenAITool(): RunnableToolFunction<Record<string, unknown>> {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: z.toJSONSchema(this.inputSchema) as JSONSchema,
        function: async (args: Record<string, unknown>) =>
          JSON.stringify(await this.execute(args)),
        parse: JSON.parse,
      },
    };
  }

  /** Format used by `generatePrompt()` for the system prompt */
  toToolSpec(): ToolSpec {
    return {
      name: this.name,
      description: this.description,
      inputSchema: z.toJSONSchema(this.inputSchema) as Record<string, unknown>,
      outputSchema: z.toJSONSchema(this.outputSchema) as Record<string, unknown>,
    };
  }
}
