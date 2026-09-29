import type { CliContext } from "../../lib/context";
import { UNKNOWN_AGENT_NAME } from "../../lib/detect-agent";
import { CreateError } from "../../lib/errors";

export interface FeedbackOptions {
  messageWords: string[];
  category?: string;
  agentName?: string;
}

const FEEDBACK_CATEGORIES = new Set(["bug", "feature", "docs", "other"]);
const DEFAULT_FEEDBACK_URL = "https://api.app.thesys.dev/agent-feedback";

export async function runFeedback(options: FeedbackOptions, ctx: CliContext): Promise<void> {
  const message = options.messageWords.join(" ").trim();
  if (!message) {
    throw new CreateError(
      "args_resolution",
      "Feedback message cannot be empty.",
      "invalid_input",
      "INVALID_FEEDBACK_MESSAGE",
    );
  }
  if (message.length > 2000) {
    throw new CreateError(
      "args_resolution",
      "Feedback message must be 2000 characters or fewer.",
      "invalid_input",
      "INVALID_FEEDBACK_MESSAGE",
    );
  }
  if (options.category && !FEEDBACK_CATEGORIES.has(options.category)) {
    throw new CreateError(
      "args_resolution",
      "Invalid feedback category. Use: bug | feature | docs | other.",
      "invalid_input",
      "INVALID_FEEDBACK_CATEGORY",
    );
  }

  const payload: {
    message: string;
    category?: string;
    agent_name?: string;
    cli_version: string;
  } = {
    message,
    cli_version: ctx.cliVersion ?? "",
  };
  if (options.category) payload.category = options.category;
  if (options.agentName && options.agentName !== UNKNOWN_AGENT_NAME) {
    payload.agent_name = options.agentName;
  }

  console.info(`Sending anonymous feedback:\n${message}`);

  let response: Response;
  try {
    response = await fetch(process.env["OPENUI_FEEDBACK_URL"] ?? DEFAULT_FEEDBACK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CreateError(
      "feedback_submission",
      `Could not send feedback: ${message}`,
      "network",
      "FEEDBACK_REQUEST_FAILED",
    );
  }

  if (!response.ok) {
    throw new CreateError(
      "feedback_submission",
      `Feedback request failed with HTTP ${response.status}.`,
      "network",
      "FEEDBACK_HTTP_ERROR",
      { http_status: response.status },
    );
  }

  console.info("Thanks! Feedback sent.");
}
