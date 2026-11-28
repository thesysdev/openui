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
   * Tool-call rounds before the model must write the dashboard. Default: 20. With `0` the
   * model calls no tools directly, but its data scripts still call them.
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
 * Creates and edits live dashboards. A call runs the tool rounds (typically 20-45 s), then,
 * once generation starts, resolves with the tool response: return it from your tool as is and
 * pass it to the renderer. Later failures aren't reported. `{ stream: true }` yields a message
 * once the dashboard has an id, and a last one once it's saved or failed: return that one.
 */
export interface Dashboard<Context extends ExecutionContext = ExecutionContext> {
  /** The dashboard is `context.userId`'s: until shared, only they can open, edit and run it. */
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
   * Edits in place, for its owner or anyone it's shared with for editing.
   * Renderers keep the current version until the edit is ready.
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
   * Reads a dashboard the user can open, own or shared. Give the model its `name` and
   * `content`, or the renderer its `id`.
   */
  get(
    params: GetDashboardParams,
    context: Context,
    options?: RequestOptions,
  ): Promise<CloudArtifact>;
  /** Runs this dashboard's data tools and generated scripts on your server. */
  readonly interpreter: Interpreter<Context>;
}
