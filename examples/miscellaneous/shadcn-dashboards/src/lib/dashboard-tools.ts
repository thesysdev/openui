import type { JSONSchema } from "openai/lib/jsonschema";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction";
import { z } from "zod";
import { dashboards, userId } from "./openui";

const createArgs = z.object({
  title: z.string().min(1).describe('A short title, such as "October sales".'),
  prompt: z
    .string()
    .min(1)
    .describe(
      "What to build: the sections, metrics, charts, and tables, and which data each shows. The dashboard is built from this alone.",
    ),
});

const editArgs = z.object({
  id: z.string().min(1).describe("The dashboard's artifact_id, art_…, from its tool result."),
  prompt: z.string().min(1).describe("The change to make."),
});

function tool<Schema extends z.ZodObject>(
  name: string,
  description: string,
  schema: Schema,
  run: (args: z.infer<Schema>) => Promise<string>,
): RunnableToolFunctionWithParse<z.infer<Schema>> {
  return {
    type: "function",
    function: {
      name,
      description,
      parameters: z.toJSONSchema(schema) as JSONSchema,
      parse: (args) => schema.parse(JSON.parse(args)),
      // runTools ends the run when a tool throws, so return the error as the tool's result.
      function: (args) =>
        run(args).catch((error: unknown) =>
          JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        ),
    },
  };
}

// The agent's tools. Each returns as soon as the dashboard has an id, while OpenUI Cloud
// generates it in the background. The result is a sentence for the model plus the artifact's
// reference, which the browser passes to the renderer as is.
export function dashboardTools(signal: AbortSignal) {
  return [
    tool(
      "create_dashboard",
      "Create a live dashboard. It loads its numbers live from npm, GitHub, and OSV.dev every time it is opened, so name the packages or repositories and describe which data to show and how, without numbers. Returns right away while the dashboard is generated.",
      createArgs,
      async ({ title, prompt }) =>
        (await dashboards.create({ title, prompt }, { userId: userId() }, { signal })).response,
    ),
    tool(
      "edit_dashboard",
      "Change a dashboard in place, such as adding a chart or a section. Returns right away; the user sees the new version when it is ready.",
      editArgs,
      async ({ id, prompt }) =>
        (await dashboards.edit({ id, prompt }, { userId: userId() }, { signal })).response,
    ),
  ];
}
