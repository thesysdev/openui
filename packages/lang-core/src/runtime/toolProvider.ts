/**
 * Standard error thrown when a tool name is not found in a function-map ToolProvider.
 * Used by Renderer's inline normalization to give clear error messages.
 */
export class ToolNotFoundError extends Error {
  readonly toolName: string;
  readonly availableTools: string[];

  constructor(toolName: string, availableTools: string[] = []) {
    super(
      `[openui] No handler for tool "${toolName}". Available: ${availableTools.join(", ") || "(none)"}`,
    );
    this.name = "ToolNotFoundError";
    this.toolName = toolName;
    this.availableTools = availableTools;
  }
}
