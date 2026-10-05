import { requireLoadReactLang } from "./slots";

// `requireLoadReactLang()` returns the host-injected loader — call it, then await.
const mod = (await requireLoadReactLang()()) as
  | {
      Renderer?: unknown;
      createParser?: unknown;
      createStreamingParser?: unknown;
    }
  | null
  | undefined;

export const Renderer = mod?.Renderer;
export const createParser = mod?.createParser;
export const createStreamingParser = mod?.createStreamingParser;
