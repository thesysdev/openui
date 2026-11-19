/**
 * Block Kit streaming: as openui-lang source accumulates, render the
 * complete-lines prefix and chat.update the message with the partial card, so
 * the UI builds up live while the model writes it.
 *
 * Works with any Slack WebClient-shaped object (needs `chat.update`). The
 * render function should come from an engine WITHOUT a tool provider (and with
 * `quiet: true`), so partial programs fall back to Query() defaults instead of
 * calling tools on every tick, and half-written lines don't log parse errors.
 */
import { isChartPlaceholder } from "./charts";
import { slackChannel } from "./library";
import type { SlackBlock } from "./types";

/** The channel's error-card fallback text; a partial render producing it is skipped. */
const ERROR_TEXT = slackChannel.errorMessage().text;

export type CardPreview = {
  /** Feed the next model delta; previews are rendered and pushed on a debounce. */
  push(delta: string): void;
  /** Cancel pending previews and wait for the in-flight update to settle. */
  dispose(): Promise<void>;
};

export type CardPreviewOptions = {
  /**
   * Minimum ms between chat.update calls (default 500). chat.update is Tier 3
   * (~50/min with burst tolerance); below ~400ms a long generation can hit the
   * limit, and Slack's client repaints visibly flicker.
   */
  interval?: number;
};

/**
 * Stream a card as Block Kit via debounced chat.update of partial renders.
 * Renders and updates are best-effort: a prefix that doesn't render yet (or
 * renders the error card) is skipped, chart placeholders are dropped (no
 * uploads mid-stream), unchanged output is skipped, and errors are swallowed -
 * the caller's final full render replaces the preview when generation ends.
 */
export function createCardPreview(
  client: any,
  channel: string,
  ts: string,
  render: (source: string) => Promise<{ output: SlackBlock[]; text: string }>,
  opts: CardPreviewOptions = {},
): CardPreview {
  const interval = opts.interval ?? 500;
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
        const blocks = (r.output ?? []).filter((b) => !isChartPlaceholder(b));
        if (!blocks.length || r.text === ERROR_TEXT) return;
        const body = JSON.stringify(blocks);
        if (body === lastSent || disposed) return;
        lastSent = body;
        await client.chat.update({ channel, ts, text: r.text, blocks });
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
