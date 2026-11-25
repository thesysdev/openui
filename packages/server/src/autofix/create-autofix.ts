import { createParser } from "@openuidev/lang-core";
import { createCloudApi, type CloudApi } from "../core/http";
import { fixGeneration } from "./fix";
import { createAutofixStream } from "./stream";
import type {
  AutofixInput,
  AutofixOptions,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
  CreateAutofixParams,
  StreamAdapter,
} from "./types";
import { AutofixError } from "./types";

/** Helpers that validate and repair one SDK's complete or streamed model output. */
export interface AutofixHelpers<Chunk> {
  fix(input: AutofixInput): Promise<AutofixResult>;
  stream(input: AutofixStreamInput<Chunk>): AutofixStream<Chunk>;
}

export function createAutofix<Chunk>(
  api: CloudApi,
  { library }: CreateAutofixParams,
  adapter: StreamAdapter<Chunk>,
): AutofixHelpers<Chunk> {
  if (!library?.schema)
    throw new AutofixError("A library spec with schema is required", "invalid_library");
  const parser = createParser(library.schema, library.root);
  const fix = fixGeneration.bind(null, { library, parser, api });

  return {
    fix,
    stream: (input: AutofixStreamInput<Chunk>) => createAutofixStream(input, fix, adapter),
  };
}

/** The standalone `createAutofix`'s connection: its own key, origin and fetch. */
export const standaloneApi = (options: AutofixOptions): CloudApi =>
  createCloudApi({ apiKey: options.apiKey, baseUrl: options.apiBaseUrl, fetch: options.fetch });
