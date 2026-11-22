/**
 * createSlackUI: the high-level Slack integration. One instance owns the
 * prompt, the engines, and the per-message state store, and exposes the three
 * things a bot does: stream a card, handle a click, handle a form submit.
 *
 * Transport-agnostic: `client` is any Slack WebClient-shaped object (Bolt's
 * `client`, Chat SDK's `slack.client`, `new WebClient(token)`), and payloads
 * are Slack's raw `block_actions` / `view_submission` bodies, which every
 * transport passes through.
 */
import type { ToolProvider, ToolSpec } from "@openuidev/lang-core";
import { createEngine } from "../core/engine";
import { MemoryStore } from "../core/store";
import type { MessageRef, MessageStore, RenderResult } from "../core/types";
import { isChartBlock, isChartPlaceholder } from "./charts";
import { buildSystemPrompt, slackChannel } from "./library";
import { buildModal, FORM_CALLBACK_ID } from "./modal";
import { inputValue, viewValues } from "./payload";
import { createCardPreview } from "./stream";
import type { SlackBlock } from "./types";

/** A tool description; `outputSchema` is optional (write-only tools often have none). */
export type SlackToolSpec = Omit<ToolSpec, "outputSchema"> & {
  outputSchema?: ToolSpec["outputSchema"];
};

export type SlackTools = {
  /** Tool descriptions, compiled into the prompt so the model can write Query()/Mutation(). */
  specs: SlackToolSpec[];
  /** Runs the tools when a card renders (Query) or an action fires (Mutation). */
  provider: ToolProvider;
};

export type SlackDeliverArgs = {
  client: any;
  channel: string;
  ts: string;
  result: RenderResult<SlackBlock[]>;
};

export type SlackUIOptions = {
  /** Enables Query()/Mutation() in both the prompt and the renderer. */
  tools?: SlackTools;
  /** Where each card's program and state are saved (default: an in-memory store). */
  store?: MessageStore;
  /** Minimum ms between streamed preview updates (default 500). */
  interval?: number;
  /** Extra rules appended to the system prompt (house style, tool conventions). */
  rules?: string[];
  /**
   * Replace how a finished card is written to its message (default: chat.update).
   * Use it to upload charts as images, add logging, or post somewhere else.
   */
  deliver?: (args: SlackDeliverArgs) => Promise<void>;
};

export type StreamedCard = RenderResult<SlackBlock[]> & {
  /** The card's message ts. */
  ts: string;
  /** The program the model wrote; send it back as the assistant turn in history. */
  source: string;
};

export type SlackUI = {
  /** The system prompt for the model. */
  prompt: string;
  /** Post a card in `channel` (optionally in a thread) and stream it as the model writes. */
  streamCard(
    client: any,
    target: { channel: string; thread_ts?: string },
    textStream: AsyncIterable<string>,
  ): Promise<StreamedCard>;
  /** Handle a raw `block_actions` payload: re-render the card in place, or open a form. */
  handleAction(client: any, payload: unknown): Promise<void>;
  /** Handle a raw `view_submission` payload from a form modal. */
  handleViewSubmission(client: any, payload: unknown): Promise<void>;
};

export { FORM_CALLBACK_ID };

const PLACEHOLDER_TEXT = "Designing your card…";

/** Strip a Markdown code fence if the model wrapped its program in one. */
function stripFences(s: string): string {
  const trimmed = s.trim();
  const fenced = trimmed.match(/^```(?:[\w-]+)?\s*\n([\s\S]*?)\n```$/);
  return (fenced ? fenced[1] : trimmed).trim();
}

/**
 * Write a finished card. Chart placeholders (charts past Slack's 2-per-message
 * limit) are dropped, since uploading images needs the optional rasterizer -
 * pass `deliver` to handle them. If the workspace rejects native chart blocks,
 * the card is sent without charts rather than not at all.
 */
async function defaultDeliver({ client, channel, ts, result }: SlackDeliverArgs): Promise<void> {
  const blocks = result.output.filter((b) => !isChartPlaceholder(b));
  try {
    await client.chat.update({ channel, ts, text: result.text, blocks });
  } catch (e: any) {
    if (e?.data?.error !== "invalid_blocks" || !blocks.some(isChartBlock)) throw e;
    await client.chat.update({
      channel,
      ts,
      text: result.text,
      blocks: blocks.filter((b) => !isChartBlock(b)),
    });
  }
}

export function createSlackUI(opts: SlackUIOptions = {}): SlackUI {
  const store = opts.store ?? new MemoryStore();
  const deliver = opts.deliver ?? defaultDeliver;
  const engine = createEngine(slackChannel, { toolProvider: opts.tools?.provider });
  // Previews render half-written programs on a debounce: no tools (queries show
  // their defaults), no parse-error logging.
  const previewEngine = createEngine(slackChannel, { quiet: true });
  const specs = opts.tools?.specs.map(
    (s) => ({ ...s, outputSchema: s.outputSchema ?? {} }) as ToolSpec,
  );
  const prompt = buildSystemPrompt(specs, opts.rules);
  const ref = (channel: string, ts: string): MessageRef => ({
    platform: "slack",
    conversationId: channel,
    messageId: ts,
  });

  async function streamCard(
    client: any,
    target: { channel: string; thread_ts?: string },
    textStream: AsyncIterable<string>,
  ): Promise<StreamedCard> {
    const { channel } = target;
    const posted = await client.chat.postMessage({
      channel,
      ...(target.thread_ts ? { thread_ts: target.thread_ts } : {}),
      text: PLACEHOLDER_TEXT,
      blocks: [{ type: "context", elements: [{ type: "mrkdwn", text: `_${PLACEHOLDER_TEXT}_` }] }],
    });
    const ts: string = posted.ts;

    const preview = createCardPreview(client, channel, ts, (s) => previewEngine.renderState(s), {
      interval: opts.interval,
    });
    let raw = "";
    try {
      for await (const delta of textStream) {
        if (!delta) continue;
        raw += delta;
        preview.push(delta);
      }
    } catch (e) {
      await preview.dispose();
      await client.chat.delete({ channel, ts }).catch(() => {});
      throw e;
    }
    await preview.dispose(); // no stale preview may land after the final card

    const source = stripFences(raw);
    const result = await engine.renderState(source);
    await deliver({ client, channel, ts, result });
    await store.save(ref(channel, ts), { source, state: result.state });
    return { ...result, ts, source };
  }

  async function handleAction(client: any, payload: unknown): Promise<void> {
    const body = payload as any;
    const action = body?.actions?.[0];
    const channel: string | undefined = body?.channel?.id ?? body?.container?.channel_id;
    const ts: string | undefined = body?.message?.ts ?? body?.container?.message_ts;
    if (!action || !channel || !ts) return;
    if (action.url) return; // a LinkButton: Slack opened the URL; nothing to re-render

    const saved = await store.get(ref(channel, ts));
    if (!saved) return; // not one of our cards, or posted before a restart with an in-memory store

    const actionId: string = action.action_id;
    if (actionId.startsWith("form:")) {
      if (!body.trigger_id) return;
      const formId = actionId.slice("form:".length);
      const spec = (await engine.renderState(saved.source, saved.state)).forms[formId];
      if (!spec) return;
      const view = buildModal(spec, JSON.stringify({ channel, ts, formId }));
      await client.views.open({ trigger_id: body.trigger_id, view });
      return;
    }

    const result = await engine.applyInteraction(saved.source, saved.state, {
      actionId,
      value: inputValue(action),
    });
    await deliver({ client, channel, ts, result });
    await store.save(ref(channel, ts), { source: saved.source, state: result.state });
  }

  async function handleViewSubmission(client: any, payload: unknown): Promise<void> {
    const view = (payload as any)?.view;
    if (view?.callback_id && view.callback_id !== FORM_CALLBACK_ID) return;
    let meta: { channel?: string; ts?: string; formId?: string } = {};
    try {
      meta = JSON.parse(view?.private_metadata || "{}");
    } catch {
      return;
    }
    const { channel, ts, formId } = meta;
    if (!channel || !ts || !formId) return;

    const saved = await store.get(ref(channel, ts));
    if (!saved) return;
    const result = await engine.submitForm(saved.source, saved.state, formId, viewValues(view));
    await deliver({ client, channel, ts, result });
    await store.save(ref(channel, ts), { source: saved.source, state: result.state });
  }

  return { prompt, streamCard, handleAction, handleViewSubmission };
}
