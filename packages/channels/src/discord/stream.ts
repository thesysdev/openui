/**
 * Discord streaming: as openui-lang source accumulates, render the
 * complete-lines prefix and edit the message with the partial card, so the UI
 * builds up live while the model writes it.
 *
 * Transport-agnostic: `edit` receives the partial message payload and should
 * PATCH the channel message (or the original interaction response). Use an
 * engine created with `quiet: true` and no tool provider for `render`, so
 * half-written programs fall back to Query() defaults without logging errors.
 */
import { discordChannel } from "./library";
import type { DiscordMessage } from "./types";

const ERROR_TEXT = discordChannel.errorMessage().text;

export type DiscordCardPreview = {
  /** Feed the next model delta; previews are rendered and pushed on a debounce. */
  push(delta: string): void;
  /** Cancel pending previews and wait for the in-flight edit to settle. */
  dispose(): Promise<void>;
};

export type DiscordCardPreviewOptions = {
  /**
   * Minimum ms between edits (default 1200). Discord rate-limits message
   * edits per channel (roughly 5 per 5 seconds), so faster previews get 429s.
   */
  interval?: number;
};

/** Drop components that reference attachments: chart PNGs are uploaded with the final render only. */
function withoutAttachments(components: any[]): any[] {
  return components
    .map((c) => {
      if (c?.type === 12) {
        const items = (c.items ?? []).filter(
          (it: any) => !String(it?.media?.url ?? "").startsWith("attachment://"),
        );
        return items.length ? { ...c, items } : null;
      }
      return Array.isArray(c?.components)
        ? { ...c, components: withoutAttachments(c.components) }
        : c;
    })
    .filter(Boolean);
}

/**
 * Stream a card via debounced edits of partial renders. Best-effort: prefixes
 * that don't render (or render the error card) are skipped, unchanged output is
 * skipped and errors are swallowed; the caller's final render replaces it.
 */
export function createCardPreview(
  edit: (message: DiscordMessage) => Promise<unknown>,
  render: (source: string) => Promise<{ output: DiscordMessage; text: string }>,
  opts: DiscordCardPreviewOptions = {},
): DiscordCardPreview {
  const interval = opts.interval ?? 1200;
  let buf = "";
  let lastSent = "";
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let chain: Promise<void> = Promise.resolve();

  const flush = (): Promise<void> => {
    chain = chain.then(async () => {
      const cut = buf.lastIndexOf("\n");
      if (disposed || cut < 0) return;
      try {
        const r = await render(buf.slice(0, cut));
        if (!r.output?.components?.length || r.text === ERROR_TEXT) return;
        const message = { ...r.output, components: withoutAttachments(r.output.components) };
        const body = JSON.stringify(message);
        if (body === lastSent || disposed) return;
        lastSent = body;
        await edit(message);
      } catch {
        // Previews are best-effort; the final render still lands.
      }
    });
    return chain;
  };

  return {
    push(delta: string): void {
      if (disposed || !delta) return;
      buf += delta;
      if (!timer) {
        timer = setTimeout(() => {
          timer = undefined;
          void flush();
        }, interval);
      }
    },
    async dispose(): Promise<void> {
      disposed = true;
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      await chain;
    },
  };
}
