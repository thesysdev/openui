import type { ClientConfig } from "./client";
import { createAutofixFix } from "./create-autofix";
import { createAutofixStream } from "./stream";
import type { AutofixInput, AutofixOptions, AutofixStreamInput, StreamAdapter } from "./types";

export type ClientAutofixStreamInput<Chunk> = AutofixStreamInput<Chunk> &
  Pick<AutofixOptions, "library">;

/** Completed OpenUI text; the provider is irrelevant once the response is assembled. */
export type ClientFixInput = AutofixInput & Pick<AutofixOptions, "library">;

/** Resolve lazily and reuse each library's parser without retaining request state. */
function createFixResolver(config: ClientConfig) {
  const fixes = new WeakMap<AutofixOptions["library"], ReturnType<typeof createAutofixFix>>();
  return (library: AutofixOptions["library"]) => {
    let fix = fixes.get(library);
    if (!fix) {
      fix = createAutofixFix({
        apiKey: config.apiKey,
        apiBaseUrl: config.baseUrl,
        fetch: config.fetch,
        library,
      });
      fixes.set(library, fix);
    }
    return fix;
  };
}

/** Bind provider events to the shared client; library state is isolated by spec. */
export function createClientAutofix<Chunk>(config: ClientConfig, adapter: StreamAdapter<Chunk>) {
  const resolveFix = createFixResolver(config);
  return {
    stream: ({ library, ...input }: ClientAutofixStreamInput<Chunk>) =>
      createAutofixStream(input, resolveFix(library), adapter),
  };
}

export function createClientFix(config: ClientConfig) {
  const resolveFix = createFixResolver(config);
  return {
    fix: ({ library, ...input }: ClientFixInput) => resolveFix(library)(input),
  };
}
