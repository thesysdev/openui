import type { ServerClientConfig } from "./client";
import { createAutofix } from "./create-autofix";
import type { AutofixInput, AutofixOptions, AutofixStreamInput, StreamAdapter } from "./types";

export type ClientAutofixInput = AutofixInput & Pick<AutofixOptions, "library">;
export type ClientAutofixStreamInput<Chunk> = AutofixStreamInput<Chunk> &
  Pick<AutofixOptions, "library">;

/** Bind provider events to the shared client; library state is isolated by spec. */
export function createClientAutofix<Chunk>(
  config: ServerClientConfig,
  adapter: StreamAdapter<Chunk>,
) {
  const pipelines = new WeakMap<
    AutofixOptions["library"],
    ReturnType<typeof createAutofix<Chunk>>
  >();
  const pipeline = (library: AutofixOptions["library"]) => {
    let existing = pipelines.get(library);
    if (!existing) {
      existing = createAutofix({ ...config, library }, adapter);
      pipelines.set(library, existing);
    }
    return existing;
  };
  return {
    fix: ({ library, ...input }: ClientAutofixInput) => pipeline(library).fix(input),
    stream: ({ library, ...input }: ClientAutofixStreamInput<Chunk>) =>
      pipeline(library).stream(input),
  };
}
