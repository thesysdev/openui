import type { ClientConfig } from "./client";
import { createAutofix, createAutofixFix } from "./create-autofix";
import type {
  AutofixInput,
  AutofixOptions,
  AutofixResult,
  AutofixStreamInput,
  StreamAdapter,
} from "./types";

export type ClientAutofixStreamInput<Chunk> = AutofixStreamInput<Chunk> &
  Pick<AutofixOptions, "library">;

/** Bind provider events to the shared client; library state is isolated by spec. */
export function createClientAutofix<Chunk>(config: ClientConfig, adapter: StreamAdapter<Chunk>) {
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
    stream: ({ library, ...input }: ClientAutofixStreamInput<Chunk>) =>
      pipeline(library).stream(input),
  };
}

/** Completed OpenUI text; the provider is irrelevant once the response is assembled. */
export type ClientFixInput = Omit<AutofixInput, "generation"> &
  Pick<AutofixOptions, "library"> & { response: string };

export function createClientFix(config: ClientConfig) {
  const fixes = new WeakMap<AutofixOptions["library"], ReturnType<typeof createAutofixFix>>();
  return {
    fix({ library, response, ...input }: ClientFixInput): Promise<AutofixResult> {
      let fix = fixes.get(library);
      if (!fix) {
        fix = createAutofixFix({ ...config, library });
        fixes.set(library, fix);
      }
      return fix({ ...input, generation: response });
    },
  };
}
