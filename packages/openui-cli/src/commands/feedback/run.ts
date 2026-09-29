import { PostHog } from "posthog-node";

import type { CliContext } from "../../lib/context";
import { UNKNOWN_AGENT_NAME } from "../../lib/detect-agent";
import { CreateError } from "../../lib/errors";
import { POSTHOG_HOST, POSTHOG_KEY } from "../../lib/telemetry";

export interface FeedbackOptions {
  messageWords: string[];
  category?: string;
  agentName?: string;
}

const FEEDBACK_CATEGORIES = new Set(["bug", "feature", "docs", "other"]);

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

  const properties: Record<string, unknown> = {
    message,
    category: options.category ?? "other",
    cli_version: ctx.cliVersion ?? "",
    $process_person_profile: false,
    // placeholder so PostHog doesn't record the sender's IP
    $ip: "0.0.0.0",
  };
  if (options.agentName && options.agentName !== UNKNOWN_AGENT_NAME) {
    properties["agent_name"] = options.agentName;
  }
  const client = new PostHog(POSTHOG_KEY, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    disableGeoip: true,
  });
  let failure: unknown;
  client.on("error", (error) => {
    failure = error;
  });
  await client.captureImmediate({
    distinctId: crypto.randomUUID(),
    event: "agent_feedback_submitted",
    properties,
  });
  await client.shutdown();
  if (failure) {
    const detail = failure instanceof Error ? failure.message : String(failure);
    throw new CreateError(
      "feedback_submission",
      `Could not send feedback: ${detail}`,
      "network",
      "FEEDBACK_REQUEST_FAILED",
    );
  }

  console.info("Thanks! Feedback sent.");
}
