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
  /** Pre-built JSON Schema — used by remote MCP tools whose schema is discovered at runtime. */
  rawInputJsonSchema?: Record<string, unknown>;
}

export class ToolDef {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: z.ZodObject<z.ZodRawShape>;
  readonly outputSchema: z.ZodType;
  readonly execute: (args: Record<string, unknown>) => Promise<unknown>;
  readonly rawInputJsonSchema?: Record<string, unknown>;

  constructor(opts: ToolDefOptions) {
    this.name = opts.name;
    this.description = opts.description;
    this.inputSchema = opts.inputSchema;
    this.outputSchema = opts.outputSchema;
    this.execute = opts.execute;
    this.rawInputJsonSchema = opts.rawInputJsonSchema;
  }

  /** Resolved JSON Schema for the input — prefers raw when available. */
  getInputJsonSchema(): Record<string, unknown> {
    return this.rawInputJsonSchema ?? (z.toJSONSchema(this.inputSchema) as Record<string, unknown>);
  }

  /** Format accepted by `client.chat.completions.runTools()` */
  toOpenAITool(): RunnableToolFunction<Record<string, unknown>> {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: this.getInputJsonSchema() as JSONSchema,
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
      inputSchema: this.getInputJsonSchema(),
      outputSchema: z.toJSONSchema(this.outputSchema) as Record<string, unknown>,
    };
  }
}
