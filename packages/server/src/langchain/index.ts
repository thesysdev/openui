import { resolveClientOptions, type ServerClientOptions } from "../shared/client";
import { createClientAutofix } from "../shared/client-autofix";
import type { AutofixOptions } from "../shared/types";
import { langGraphAdapter } from "./adapter";

export { ServerClientError } from "../shared/client";
export type { ServerClientOptions } from "../shared/client";
export type { ClientAutofixInput, ClientAutofixStreamInput } from "../shared/client-autofix";
export { AutofixError } from "../shared/types";
export type { AutofixResult, AutofixStream } from "../shared/types";
export type { LangGraphStreamEvent } from "./types";

/** Configure native LangGraph SDK event streams. */
export function createServerClient(options: ServerClientOptions = {}) {
  return {
    autofix: { langgraph: createClientAutofix(resolveClientOptions(options), langGraphAdapter) },
  };
}
export type ServerClient = ReturnType<typeof createServerClient>;

/** @deprecated Use createServerClient().autofix.langgraph with a library per operation. */
export function createAutofix(options: AutofixOptions) {
  const { langgraph } = createServerClient(options).autofix;
  return {
    langgraph: {
      fix: (input: Omit<Parameters<typeof langgraph.fix>[0], "library">) =>
        langgraph.fix({ ...input, library: options.library }),
      stream: (input: Omit<Parameters<typeof langgraph.stream>[0], "library">) =>
        langgraph.stream({ ...input, library: options.library }),
    },
  };
}
