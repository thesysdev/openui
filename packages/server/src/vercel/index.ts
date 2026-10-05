import { resolveClientOptions, type ServerClientOptions } from "../shared/client";
import { createClientAutofix } from "../shared/client-autofix";
import type { AutofixOptions } from "../shared/types";
import { vercelAIAdapter } from "./adapter";
import { eveStreamAdapter } from "./eve-adapter";

export { ServerClientError } from "../shared/client";
export type { ServerClientOptions } from "../shared/client";
export type { ClientAutofixInput, ClientAutofixStreamInput } from "../shared/client-autofix";
export { AutofixError } from "../shared/types";
export type { AutofixResult, AutofixStream } from "../shared/types";

/** Configure AI SDK UI message Autofix. */
export function createServerClient(options: ServerClientOptions = {}) {
  const config = resolveClientOptions(options);
  return {
    autofix: {
      ai: createClientAutofix(config, vercelAIAdapter),
      eve: createClientAutofix(config, eveStreamAdapter),
    },
  };
}

export type ServerClient = ReturnType<typeof createServerClient>;

/** @deprecated Use createServerClient().autofix.ai with a library per operation. */
export function createAutofix(options: AutofixOptions) {
  const { ai } = createServerClient(options).autofix;
  return {
    ai: {
      fix: (input: Omit<Parameters<typeof ai.fix>[0], "library">) =>
        ai.fix({ ...input, library: options.library }),
      stream: (input: Omit<Parameters<typeof ai.stream>[0], "library">) =>
        ai.stream({ ...input, library: options.library }),
    },
  };
}

export type { MessageStreamEvent as EveStreamEvent } from "eve/client";
