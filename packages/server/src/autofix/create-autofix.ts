import { createParser } from "@openuidev/lang-core";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { THESYS_API_BASE_URL } from "../constants";
import { fixGeneration } from "./fix";
import { createAutofixStream } from "./stream";
import type {
  AutofixInput,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
  StreamAdapter,
} from "./types";
import { AutofixError } from "./types";

/** Create helpers to validate and repair complete or streamed model output. */
export function createAutofix(options: AutofixOptions): {
  fix(input: AutofixInput & { generation: string }): Promise<AutofixResult>;
  stream(input: AutofixStreamInput): AutofixStream<ChatCompletionChunk>;
  stream<Input, Output>(
    input: AutofixStreamInput<Input, Output> & { adapter: StreamAdapter<Input, Output> },
  ): AutofixStream<Output>;
} {
  const { library } = options;
  if (!library?.schema)
    throw new AutofixError("A library spec with schema is required", "invalid_library");
  const parser = createParser(library.schema, library.root);
  const endpoint = `${(options.apiBaseUrl ?? THESYS_API_BASE_URL).replace(/\/+$/, "")}/v1/autofix`;
  const fetchFn = options.fetch ?? globalThis.fetch;

  const fix = fixGeneration.bind(null, {
    library,
    apiKey: options.apiKey,
    parser,
    endpoint,
    fetchFn,
  });

  return {
    fix,
    // Wrap model emissions with validation and repair before the stream finishes.
    stream: <Input = ChatCompletionChunk, Output = ChatCompletionChunk>(
      input: AutofixStreamInput<Input, Output>,
    ) => createAutofixStream(input, fix),
  };
}
