import type { RequestOptions } from "../../core/resource";
import type { ExecutionContext, Interpreter, InterpreterOptions } from "../../interpreter/types";
import type { ArtifactLibrary, ArtifactPromptOptions, CloudArtifact } from "../types";

export type DashboardOptions<Context extends ExecutionContext = ExecutionContext> = {
  library: ArtifactLibrary;
  /** The model that builds and edits dashboards, as `provider/model`. */
  model: string;
  /** How much the model thinks, for models that can: as OpenAI's `reasoning_effort`. */
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  /**
   * How many rounds of tool calls the model may make before it must write the dashboard
   * (OpenUI Cloud's default: 20). Each round can call several of your tools. With `0` the model
   * calls none of your tools directly; it still saves and runs its data scripts, which call them.
   */
  maxToolRounds?: number;
  promptOptions?: ArtifactPromptOptions;
  /**
   * Your business context: what it does, who reads the dashboards, your terms,
   * calendar and units. The same for every user; sent with every create and edit.
   */
  instructions?: string;
} & InterpreterOptions<Context>;

export interface CreateDashboardParams {
  /** A short title, such as "Q3 sales by region". */
  title: string;
  /** What to build. The subagent sees only this, so include any data it needs. */
  prompt: string;
}

export interface EditDashboardParams {
  id: string;
  /** The change to make, and any data it needs. */
  prompt: string;
}

export interface GetDashboardParams {
  id: string;
}

/**
 * Creates and edits live dashboards. Each call first runs the model's tool rounds against your
 * tools (typically 20-45 s), then resolves, once the dashboard starts generating, with the tool's
 * response: return it from your tool as is, and pass it to the renderer. A plain call doesn't
 * report a failure after that point.
 *
 * With `{ stream: true }` it yields two messages instead: one as soon as the dashboard has an id
 * (render it from then on), and the last once the dashboard is saved or failed, saying which.
 * Each carries the dashboard's reference; return the last one to your model.
 */
export interface Dashboard<Context extends ExecutionContext = ExecutionContext> {
  /**
   * `context` says who's asking, as for the interpreter: the dashboard belongs
   * to `context.userId`. Until they share it, only they can read, edit and run it.
   */
  create(
    params: CreateDashboardParams,
    context: Context,
    options: RequestOptions & { stream: true },
  ): AsyncIterable<string>;
  create(
    params: CreateDashboardParams,
    context: Context,
    options?: RequestOptions & { stream?: false },
  ): Promise<string>;
  /**
   * Edits in place, for its owner or anyone it's shared with for editing, through
   * `context.userId` or `context.groupIds`. Renderers keep the current version until the edit is ready.
   */
  edit(
    params: EditDashboardParams,
    context: Context,
    options: RequestOptions & { stream: true },
  ): AsyncIterable<string>;
  edit(
    params: EditDashboardParams,
    context: Context,
    options?: RequestOptions & { stream?: false },
  ): Promise<string>;
  /**
   * Reads a dashboard the user can open: their own, or one shared with them through
   * `context.userId` or `context.groupIds`. Give the model its `name` and `content`, or the
   * renderer its `id`.
   */
  get(
    params: GetDashboardParams,
    context: Context,
    options?: RequestOptions,
  ): Promise<CloudArtifact>;
  /** Runs this dashboard's data tools and generated scripts on your server. */
  readonly interpreter: Interpreter<Context>;
}
