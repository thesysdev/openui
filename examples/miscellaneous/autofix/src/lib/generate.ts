import { requestAutofix } from "./autofix";
import {
  type ChatEvent,
  type ConversationTurn,
  MAX_GENERATION_CHARS,
  recentContext,
} from "./contract";
import { streamGeneration } from "./provider";
import { findErrors } from "./validation";

export interface GenerationOptions {
  apiKey: string;
  model: string;
  baseURL?: string;
  autofixKey: string;
  autofixURL?: string;
  signal: AbortSignal;
  generate?: typeof streamGeneration;
  repair?: typeof requestAutofix;
}

/** Stream one model answer, then validate the completed program and repair only if needed. */
export async function* generateAndRepair(
  messages: ConversationTurn[],
  options: GenerationOptions,
): AsyncGenerator<ChatEvent> {
  const context = recentContext(messages);
  let generation = "";
  for await (const delta of (options.generate ?? streamGeneration)(
    context,
    options,
  )) {
    options.signal.throwIfAborted();
    if (generation.length + delta.length > MAX_GENERATION_CHARS)
      throw new Error(
        "The model output exceeded 100,000 characters. Try a smaller request.",
      );
    generation += delta;
    yield { type: "delta", text: delta };
  }
  options.signal.throwIfAborted();
  if (!generation.trim())
    throw new Error("The model returned no interface. Try again.");

  // Incomplete references during streaming are normal. Decide only after the stream ends.
  if (findErrors(generation).length === 0) {
    yield {
      type: "result",
      report: {
        generation,
        output: generation,
        status: "valid",
        fixedErrors: [],
        remainingErrors: [],
      },
    };
    return;
  }

  yield { type: "repairing" };
  options.signal.throwIfAborted();
  const completion = await (options.repair ?? requestAutofix)(
    { generation, context },
    {
      apiKey: options.autofixKey,
      url: options.autofixURL,
      signal: options.signal,
    },
  );
  options.signal.throwIfAborted();
  const output = completion.choices[0].message.content;
  const remainingErrors = output
    ? findErrors(output)
    : completion.fix_summary.unfixed_errors;
  const failed =
    completion.fix_summary.status === "fix_failed" ||
    remainingErrors.length > 0;
  yield {
    type: "result",
    report: {
      generation,
      output: failed ? null : output,
      status: failed ? "fix_failed" : completion.fix_summary.status,
      fixedErrors: completion.fix_summary.fixed_errors,
      remainingErrors,
      usage: completion.usage,
    },
  };
}
