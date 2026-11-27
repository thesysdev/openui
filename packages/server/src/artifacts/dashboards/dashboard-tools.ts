import { OpenUIApiError } from "../../core/errors";
import {
  ToolExecutionError,
  type ExecutionContext,
  type ToolDefinition,
} from "../../interpreter/types";
import type {
  CreateDashboardParams,
  Dashboard,
  DashboardTool,
  DashboardToolSchema,
  DashboardTools,
  EditDashboardParams,
  GetDashboardParams,
} from "./types";

// The dashboard tools' copy, schemas and calls, shared by `tools()` and the MCP server.
// Guidance lives in the descriptions: most agent SDKs drop an MCP server's `instructions`.

const TOOL_NAMES = {
  create: "create_dashboard",
  edit: "edit_dashboard",
  get: "get_dashboard",
} as const;

type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/** For MCP clients that read `instructions`. */
export const SERVER_INSTRUCTIONS = `Build and change live dashboards for the signed-in user. A dashboard loads its own data every time it opens, so you never see its numbers and must not state any.
- Call create_dashboard only when the user asks for a new dashboard. "It" or "this" means the dashboard you made or changed last: change it with edit_dashboard and its id.
- Write each prompt as a complete brief. The builder sees only the prompt, not this conversation.
- Build what the user asked for. Don't add sections they didn't ask for; if the request is vague, pick a sensible set and say so.
- To answer a question about a dashboard, or before changing one from an earlier conversation, read it with get_dashboard.
- The user watches the dashboard build, so after a create or edit reply in ONE short sentence: name the dashboard and offer one change. Example: "Your sales by region dashboard is on its way. Want a filter by quarter too?" Don't list its sections, charts or numbers, and don't repeat the tool result.`;

/** Models follow a reminder in the result more reliably than one in the description. */
const RESULT_REMINDER: Partial<Record<ToolName, string>> = {
  [TOOL_NAMES.create]:
    "Reply to the user in ONE short sentence: name the dashboard and offer one change. Don't list its sections, charts or numbers; they're on screen.",
  [TOOL_NAMES.edit]:
    "Reply to the user in ONE short sentence saying what changed. Don't list the rest of the dashboard.",
};

/** A data tool's first sentence, for "Dashboards can show". */
function dataLine({ name, description = "" }: ToolDefinition): string {
  const sentence = (description.split(/(?<=\.)\s+(?=[A-Z])/)[0] ?? "")
    .replace(/\s*\([^()]*\)/g, "")
    .replace(/\.$/, "");
  if (sentence.length <= 160) return `- ${name}: ${sentence}`;
  const cut = sentence.slice(0, 160);
  return `- ${name}: ${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

const string = (description: string) => ({ type: "string" as const, description });

const ID = string(
  "The dashboard's id (art_…), from the create_dashboard, edit_dashboard or get_dashboard result for it.",
);

/** Each tool's input: every property a required string. */
const INPUTS = {
  [TOOL_NAMES.create]: {
    title: string('A short title the user will recognise, such as "Orders, last 30 days".'),
    prompt: string(
      "The complete brief. The builder sees only this, not the chat: the question the dashboard answers, its sections, metrics, charts, tables and filters, the time range, and which data each part uses. Include every name, id and preference from the conversation. Ask only for what the user wants; don't add sections they didn't ask for. No numbers.",
    ),
  },
  [TOOL_NAMES.edit]: {
    id: ID,
    prompt: string(
      "The change, written to stand alone: what to add, remove or change, and which data it uses. No numbers.",
    ),
  },
  [TOOL_NAMES.get]: { id: ID },
} satisfies Record<ToolName, Record<string, { type: "string"; description: string }>>;

/** The required keys `input` lacks. */
function missing(input: Record<string, unknown>, keys: string[]): string[] {
  return keys.filter((key) => typeof input[key] !== "string" || !(input[key] as string).trim());
}

/** Each tool's copy, with the data dashboards can show. */
function toolSpecs(data: ToolDefinition[]) {
  const dataList = data.length
    ? `\n\nDashboards can show this data, and nothing else:\n${data.map(dataLine).join("\n")}`
    : "";
  return {
    [TOOL_NAMES.create]: {
      title: "Create dashboard",
      description: `Create a new live dashboard for the user. Use it only when the user asks for a new dashboard; to change an existing one, call edit_dashboard. The dashboard loads its data live every time it opens, so describe what to show and never include numbers. Returns once the dashboard starts building (usually 20-45 s). The user watches it build, so then reply in ONE short sentence that names the dashboard and offers one change. Don't list its sections or repeat the result.${dataList}`,
      properties: INPUTS[TOOL_NAMES.create],
      readOnly: false,
    },
    [TOOL_NAMES.edit]: {
      title: "Edit dashboard",
      description:
        'Change an existing dashboard in place: add, remove or rework sections, charts, tables or filters. "It" or "this" means the dashboard you created or changed last; use its id. Prefer this over create_dashboard unless the user asks for a new dashboard. Make one change per call. Returns once the change starts; the user sees the dashboard update, so then reply in ONE short sentence saying what changed.',
      properties: INPUTS[TOOL_NAMES.edit],
      readOnly: false,
    },
    [TOOL_NAMES.get]: {
      title: "Read dashboard",
      description:
        "Read a dashboard the user can open: its name, its layout as an OpenUI program (sections, charts, tables, and the data each uses) and whether the user can edit it. It has no numbers; the dashboard loads them when it opens. Use it to answer questions about a dashboard, or before changing one from an earlier conversation. Answer from it in plain words; don't paste the program. If isEditable is false, don't call edit_dashboard: offer to create a new dashboard instead.",
      properties: INPUTS[TOOL_NAMES.get],
      readOnly: true,
    },
  } satisfies Record<ToolName, unknown>;
}

/** Every property is a required string. */
function jsonSchema(properties: Record<string, { type: "string"; description: string }>) {
  return {
    type: "object" as const,
    properties,
    required: Object.keys(properties),
    additionalProperties: false as const,
  };
}

/** The JSON Schema plus a hidden `~standard`: Standard Schema SDKs find it, `JSON.stringify` skips it. */
function dualSchema(
  properties: Record<string, { type: "string"; description: string }>,
): DashboardToolSchema {
  const schema = jsonSchema(properties);
  Object.defineProperty(schema, "~standard", {
    enumerable: false,
    value: {
      version: 1,
      vendor: "openui",
      validate(value: unknown) {
        const input = (value ?? {}) as Record<string, unknown>;
        const keys = missing(input, schema.required);
        return keys.length
          ? { issues: keys.map((key) => ({ message: `${key} is required.`, path: [key] })) }
          : { value: input };
      },
      jsonSchema: {
        input: () => jsonSchema(properties),
        output: () => jsonSchema(properties),
      },
    },
  });
  return schema as DashboardToolSchema;
}

/** A sentence the model can act on. */
export function explain(error: unknown, tool: string, input: Record<string, unknown>): string {
  const known = error instanceof OpenUIApiError || error instanceof ToolExecutionError;
  if (known && error.code === "invalid_input") return error.message;
  const failed =
    tool === TOOL_NAMES.get
      ? "The dashboard couldn't be read"
      : tool === TOOL_NAMES.edit
        ? "The change couldn't be started"
        : "The dashboard couldn't be started";
  if (known) {
    if (error.status === 404) {
      return `No dashboard with id ${String(input["id"])} that this user can open. Use the id from a create_dashboard or edit_dashboard result.`;
    }
    if (error.status === 403) {
      return "This user can't change that dashboard. Offer to create a new one instead.";
    }
    if (error.status === 409) {
      return "That dashboard is being changed right now. Wait for the change to finish, then try again.";
    }
    if (error.status === 429) {
      return "Too many dashboard requests right now. Tell the user to try again in a minute.";
    }
  }
  if (error instanceof Error && error.name === "AbortError") return "The request was cancelled.";
  return `${failed}: ${error instanceof Error ? error.message : String(error)}`;
}

/** Runs one tool as `context`'s user. The reminder is kept apart from the response. */
export async function runTool<Context extends ExecutionContext>(
  dashboard: Pick<Dashboard<Context>, "create" | "edit" | "get">,
  name: string,
  input: Record<string, unknown>,
  context: Context,
  signal?: AbortSignal,
): Promise<{ text: string; reminder?: string }> {
  if (!(name in INPUTS)) {
    throw new OpenUIApiError(
      `Unknown tool "${name}". Use create_dashboard, edit_dashboard or get_dashboard.`,
      "invalid_input",
    );
  }
  const keys = missing(input, Object.keys(INPUTS[name as ToolName]));
  if (keys.length) throw new OpenUIApiError(`${keys.join(", ")} is required.`, "invalid_input");

  if (name === TOOL_NAMES.get) {
    const params = input as unknown as GetDashboardParams;
    const { name: title, content, isEditable } = await dashboard.get(params, context, { signal });
    return { text: JSON.stringify({ name: title, content, isEditable }) };
  }
  const text =
    name === TOOL_NAMES.create
      ? await dashboard.create(input as unknown as CreateDashboardParams, context, { signal })
      : await dashboard.edit(input as unknown as EditDashboardParams, context, { signal });
  return { text, reminder: RESULT_REMINDER[name as ToolName] };
}

/** The framework's abort signal, whatever it calls it. */
function signalOf(callContext: unknown): AbortSignal | undefined {
  if (typeof callContext !== "object" || callContext === null) return undefined;
  const { abortSignal, signal } = callContext as { abortSignal?: unknown; signal?: unknown };
  const found = abortSignal ?? signal;
  return found instanceof AbortSignal ? found : undefined;
}

/** The tools for agent frameworks. The reminder follows the reference line, which renderers ignore. */
export async function dashboardTools<Context extends ExecutionContext>(
  dashboard: Pick<Dashboard<Context>, "create" | "edit" | "get">,
  data: () => Promise<ToolDefinition[]>,
  user: Context | ((callContext: unknown) => Context | Promise<Context>),
): Promise<DashboardTools> {
  const specs = toolSpecs(await data());
  const tool = (name: ToolName): DashboardTool => ({
    name,
    description: specs[name].description,
    inputSchema: dualSchema(specs[name].properties),
    async execute(args, callContext) {
      try {
        const context = typeof user === "function" ? await user(callContext) : user;
        const { text, reminder } = await runTool(
          dashboard,
          name,
          args,
          context,
          signalOf(callContext),
        );
        return reminder ? `${text}\n\n${reminder}` : text;
      } catch (error) {
        throw new Error(explain(error, name, args), { cause: error });
      }
    },
  });
  return {
    create_dashboard: tool(TOOL_NAMES.create),
    edit_dashboard: tool(TOOL_NAMES.edit),
    get_dashboard: tool(TOOL_NAMES.get),
  };
}

/** The tools as MCP lists them. */
export async function mcpToolList(data: () => Promise<ToolDefinition[]>) {
  const specs = toolSpecs(await data());
  return Object.entries(specs).map(([name, spec]) => ({
    name,
    title: spec.title,
    description: spec.description,
    inputSchema: jsonSchema(spec.properties),
    annotations: {
      readOnlyHint: spec.readOnly,
      destructiveHint: false,
      idempotentHint: spec.readOnly,
      openWorldHint: false,
    },
  }));
}
