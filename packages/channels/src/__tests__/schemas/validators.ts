/**
 * Per-surface payload validators used by the deterministic schema tests and
 * the e2e prompt matrix. Verification comes from external authorities where
 * they exist:
 *   - Slack:    @tightknitai/slack-block-kit-validator (community JSON Schema)
 *               plus containment rules the schema is permissive about
 *   - Telegram: validators generated from the daily-updated machine-readable
 *               Bot API spec (see telegram.ts)
 *   - WhatsApp: no official machine-readable spec exists; hand-written checks
 *               encoding the Cloud API's documented limits
 *   - Discord:  no official machine-readable spec exists; hand-written checks
 *               encoding the Components V2 reference (docs.discord.com/developers/components/reference)
 * Each validator returns a list of problems; empty list = pass.
 */
import { validateBlockKit } from "@tightknitai/slack-block-kit-validator";
import type { DiscordMessage, DiscordModal } from "../../discord";
import type { SlackBlock } from "../../slack";
import type { TgCard } from "../../telegram";
import type { WaMessage } from "../../whatsapp";
import { telegramValidator } from "./telegram";

export { validateTeamsCard as validateTeams } from "./teams";

// --- Slack ---

/** Element types Slack rejects inside `actions` blocks (section/input only). */
const SLACK_NO_MULTI_IN_ACTIONS = /^multi_/;

/**
 * data_visualization isn't in the community schema yet; validate its documented
 * rules by hand (docs.slack.dev/reference/block-kit/blocks/data-visualization-block).
 */
function validateSlackChart(b: SlackBlock, i: number): string[] {
  const p: string[] = [];
  const where = `#${i} data_visualization`;
  if (!b.title) p.push(`${where}: title is required`);
  if ((b.title ?? "").length > 50) p.push(`${where}: title over 50 chars`);
  const chart = b.chart ?? {};
  if (chart.type === "pie") {
    const segments = chart.segments ?? [];
    if (segments.length < 1 || segments.length > 12)
      p.push(`${where}: pie needs 1-12 segments, has ${segments.length}`);
    for (const s of segments) {
      if (!(s.value > 0)) p.push(`${where}: pie segment "${s.label}" value must be > 0`);
      if ((s.label ?? "").length > 20) p.push(`${where}: segment label over 20 chars`);
    }
  } else if (["bar", "line", "area"].includes(chart.type)) {
    const series = chart.series ?? [];
    const categories: string[] = chart.axis_config?.categories ?? [];
    if (series.length < 1 || series.length > 12)
      p.push(`${where}: needs 1-12 series, has ${series.length}`);
    if (!categories.length) p.push(`${where}: axis_config.categories is required`);
    for (const label of ["x_label", "y_label"]) {
      if ((chart.axis_config?.[label] ?? "").length > 50)
        p.push(`${where}: ${label} over 50 chars`);
    }
    const names = new Set<string>();
    for (const s of series) {
      if ((s.name ?? "").length > 20) p.push(`${where}: series name over 20 chars`);
      if (names.has(s.name)) p.push(`${where}: duplicate series name "${s.name}"`);
      names.add(s.name);
      const data = s.data ?? [];
      if (data.length < 1 || data.length > 20)
        p.push(`${where}: series needs 1-20 points, has ${data.length}`);
      if (
        data.length !== categories.length ||
        data.some((d: any, j: number) => d.label !== categories[j])
      ) {
        p.push(`${where}: series "${s.name}" data must have exactly one point per category`);
      }
      for (const d of data) {
        if (typeof d.value !== "number" || !Number.isFinite(d.value))
          p.push(`${where}: non-numeric data value for "${d.label}"`);
      }
    }
  } else {
    p.push(`${where}: chart.type must be pie, bar, line, or area (got ${chart.type})`);
  }
  return p;
}

export function validateSlack(blocks: SlackBlock[]): string[] {
  const problems: string[] = [];
  // The community schema predates data_visualization; validate those by hand.
  const charts = blocks.filter((b) => b.type === "data_visualization");
  const rest = blocks.filter((b) => b.type !== "data_visualization");
  if (rest.length) {
    const result = validateBlockKit(rest as any);
    if (!result.valid)
      problems.push(
        ...(result.errors ?? []).map(
          (e: any) => `schema: ${typeof e === "string" ? e : e.message}`,
        ),
      );
  }
  if (charts.length > 2)
    problems.push(
      `${charts.length} data_visualization blocks (Slack allows at most 2 per message)`,
    );
  blocks.forEach((b, i) => {
    if (b.type === "data_visualization") problems.push(...validateSlackChart(b, i));
    if (b.type === "actions") {
      for (const el of b.elements ?? []) {
        if (SLACK_NO_MULTI_IN_ACTIONS.test(el.type ?? "")) {
          problems.push(
            `#${i}: ${el.type} is not allowed inside an actions block (section accessory or input only)`,
          );
        }
      }
    }
  });
  return problems;
}

/** Modal views: validate the envelope shape and each input block's element. */
export function validateSlackModal(view: any): string[] {
  const problems: string[] = [];
  if (view?.type !== "modal") problems.push("view.type must be 'modal'");
  if (!view?.title?.text) problems.push("modal missing title");
  if ((view?.title?.text ?? "").length > 24) problems.push("modal title over 24 chars");
  const blocks = view?.blocks ?? [];
  if (!blocks.length) problems.push("modal has no blocks");
  const result = validateBlockKit(blocks);
  if (!result.valid)
    problems.push(
      ...(result.errors ?? []).map((e: any) => `schema: ${typeof e === "string" ? e : e.message}`),
    );
  return problems;
}

// --- Telegram ---

export function validateTelegram(card: TgCard): string[] {
  const problems: string[] = [];
  if (!card.blocks.length) problems.push("card has no blocks");

  const richValidator = telegramValidator("InputRichMessage");
  if (!richValidator({ blocks: card.blocks })) {
    problems.push(
      ...(richValidator.errors ?? []).map((e) => `rich_message${e.instancePath}: ${e.message}`),
    );
  }

  if (card.keyboard.length) {
    const kbValidator = telegramValidator("InlineKeyboardMarkup");
    if (!kbValidator({ inline_keyboard: card.keyboard })) {
      problems.push(
        ...(kbValidator.errors ?? []).map((e) => `keyboard${e.instancePath}: ${e.message}`),
      );
    }
  }
  card.keyboard.forEach((row, r) => {
    if (row.length < 1 || row.length > 8)
      problems.push(`keyboard row ${r} has ${row.length} buttons (1-8 allowed)`);
    for (const b of row) {
      if (b.callback_data && Buffer.byteLength(b.callback_data, "utf8") > 64) {
        problems.push(`keyboard row ${r}: callback_data over 64 bytes`);
      }
      if (!b.callback_data && !b.url && !b.copy_text)
        problems.push(`keyboard row ${r}: button with no behavior`);
    }
  });
  return problems;
}

// --- WhatsApp (Cloud API documented limits; no official schema exists) ---

export function validateWhatsApp(messages: WaMessage[]): string[] {
  const out: string[] = [];
  messages.forEach((m, i) => {
    if (m.type === "text") {
      if (!m.text?.body) out.push(`#${i} text without body`);
      else if (m.text.body.length > 4096) out.push(`#${i} body exceeds 4096 chars`);
    } else if (m.type === "image") {
      if (!(m as any).chartId && !m.image?.link && !m.image?.id)
        out.push(`#${i} image without source`);
      if ((m as any).caption !== undefined) out.push(`#${i} caption must be inside image`);
      if ((m.image?.caption ?? "").length > 1024) out.push(`#${i} caption over 1024 chars`);
    } else if (m.type === "interactive") {
      const it = m.interactive;
      if (it?.type === "button") {
        const buttons = it.action?.buttons ?? [];
        if (buttons.length < 1 || buttons.length > 3)
          out.push(`#${i} has ${buttons.length} buttons (1-3 allowed)`);
        for (const b of buttons) {
          if ((b.reply?.title ?? "").length > 20) out.push(`#${i} button title over 20 chars`);
          if ((b.reply?.id ?? "").length > 256) out.push(`#${i} button id over 256 chars`);
        }
        if (!it.body?.text || it.body.text.length > 1024)
          out.push(`#${i} interactive body missing or over 1024`);
        if ((it.footer?.text ?? "").length > 60) out.push(`#${i} footer over 60 chars`);
        if (
          it.header &&
          it.header.type === "image" &&
          !it.header.image?.link &&
          !it.header.image?.id
        )
          out.push(`#${i} image header without source`);
      } else if (it?.type === "list") {
        const rows = (it.action?.sections ?? []).flatMap((s: any) => s.rows ?? []);
        if (rows.length < 1 || rows.length > 10)
          out.push(`#${i} list has ${rows.length} rows (1-10 allowed)`);
        for (const r of rows) {
          if ((r.title ?? "").length > 24) out.push(`#${i} row title over 24 chars`);
          if ((r.description ?? "").length > 72) out.push(`#${i} row description over 72 chars`);
        }
        if (it.header && (it.header.type !== "text" || (it.header.text ?? "").length > 60))
          out.push(`#${i} list header must be text of at most 60 chars`);
        if ((it.footer?.text ?? "").length > 60) out.push(`#${i} footer over 60 chars`);
        if (!it.action?.button || it.action.button.length > 20)
          out.push(`#${i} list button label missing or over 20`);
      } else {
        out.push(`#${i} unknown interactive type ${it?.type}`);
      }
    } else if (m.type === "location") {
      const { latitude, longitude } = m.location ?? {};
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) out.push(`#${i} invalid latitude`);
      if (!Number.isFinite(longitude) || Math.abs(longitude) > 180)
        out.push(`#${i} invalid longitude`);
    } else {
      out.push(`#${i} unknown message type ${m.type}`);
    }
  });
  return out;
}

// --- Discord (Components V2 reference; no official machine-readable spec exists) ---

const DISCORD_CONTAINER_CHILDREN = new Set([1, 9, 10, 12, 14, 13]);
const DISCORD_TOP_LEVEL = new Set([1, 9, 10, 11, 12, 13, 14, 17]);

function discordButton(b: any, where: string, out: string[]): void {
  if (![1, 2, 3, 4, 5].includes(b.style)) out.push(`${where}: invalid button style ${b.style}`);
  if ((b.label ?? "").length > 80) out.push(`${where}: label over 80 chars`);
  if (b.style === 5) {
    if (!b.url) out.push(`${where}: link button without url`);
    if (b.custom_id) out.push(`${where}: link button cannot have custom_id`);
    if ((b.url ?? "").length > 512) out.push(`${where}: url over 512 chars`);
  } else {
    if (!b.custom_id || b.custom_id.length > 100)
      out.push(`${where}: custom_id must be 1-100 chars`);
    if (b.url) out.push(`${where}: non-link button cannot have url`);
  }
}

function discordSelect(s: any, where: string, out: string[]): void {
  if (!s.custom_id || s.custom_id.length > 100) out.push(`${where}: custom_id must be 1-100 chars`);
  const options = s.options ?? [];
  if (options.length < 1 || options.length > 25) out.push(`${where}: needs 1-25 options`);
  if ((s.placeholder ?? "").length > 150) out.push(`${where}: placeholder over 150 chars`);
  for (const o of options) {
    if (!o.label || o.label.length > 100) out.push(`${where}: option label must be 1-100 chars`);
    if (!o.value || o.value.length > 100) out.push(`${where}: option value must be 1-100 chars`);
    if ((o.description ?? "").length > 100) out.push(`${where}: option description over 100 chars`);
  }
  if (options.filter((o: any) => o.default).length > (s.max_values ?? 1))
    out.push(`${where}: more defaults than max_values`);
}

function discordComponent(c: any, where: string, out: string[]): void {
  switch (c.type) {
    case 1: {
      const kids = c.components ?? [];
      const buttons = kids.filter((k: any) => k.type === 2);
      if (kids.length < 1) out.push(`${where}: empty action row`);
      if (buttons.length && buttons.length !== kids.length)
        out.push(`${where}: action row mixes buttons and selects`);
      if (buttons.length > 5)
        out.push(`${where}: action row has ${buttons.length} buttons (max 5)`);
      if (!buttons.length && kids.length !== 1)
        out.push(`${where}: a select must be alone in its row`);
      kids.forEach((k: any, i: number) => {
        if (k.type === 2) discordButton(k, `${where}.${i}`, out);
        else if (k.type === 3) discordSelect(k, `${where}.${i}`, out);
        else out.push(`${where}.${i}: type ${k.type} not allowed in an action row`);
      });
      break;
    }
    case 9: {
      const kids = c.components ?? [];
      if (kids.length < 1 || kids.length > 3) out.push(`${where}: section needs 1-3 text displays`);
      if (kids.some((k: any) => k.type !== 10))
        out.push(`${where}: section children must be text displays`);
      kids.forEach((k: any, i: number) => discordComponent(k, `${where}.${i}`, out));
      if (c.accessory?.type === 11) discordComponent(c.accessory, `${where}.accessory`, out);
      else if (c.accessory?.type === 2) discordButton(c.accessory, `${where}.accessory`, out);
      else out.push(`${where}: section accessory must be a thumbnail or button`);
      break;
    }
    case 10:
      if (!c.content) out.push(`${where}: text display without content`);
      if ((c.content ?? "").length > 4000) out.push(`${where}: text display over 4000 chars`);
      break;
    case 11:
      if (!c.media?.url) out.push(`${where}: thumbnail without media.url`);
      if ((c.description ?? "").length > 1024) out.push(`${where}: description over 1024 chars`);
      break;
    case 12: {
      const items = c.items ?? [];
      if (items.length < 1 || items.length > 10)
        out.push(`${where}: media gallery needs 1-10 items`);
      for (const it of items) {
        if (!it.media?.url) out.push(`${where}: gallery item without media.url`);
        if ((it.description ?? "").length > 1024) out.push(`${where}: description over 1024 chars`);
      }
      break;
    }
    case 14:
      if (c.spacing !== undefined && ![1, 2].includes(c.spacing))
        out.push(`${where}: separator spacing must be 1 or 2`);
      break;
    case 17: {
      if (c.accent_color != null && !(c.accent_color >= 0 && c.accent_color <= 0xffffff))
        out.push(`${where}: accent_color out of range`);
      (c.components ?? []).forEach((k: any, i: number) => {
        if (!DISCORD_CONTAINER_CHILDREN.has(k.type))
          out.push(`${where}.${i}: type ${k.type} not allowed in a container`);
        discordComponent(k, `${where}.${i}`, out);
      });
      break;
    }
    default:
      out.push(`${where}: unknown component type ${c.type}`);
  }
}

const discordCount = (c: any): number =>
  1 +
  (c.components ?? []).reduce((n: number, k: any) => n + discordCount(k), 0) +
  (c.accessory ? 1 : 0);
const discordText = (c: any): number =>
  (c.content ?? "").length +
  (c.components ?? []).reduce((n: number, k: any) => n + discordText(k), 0);

export function validateDiscord(message: DiscordMessage): string[] {
  const out: string[] = [];
  if (!(message.flags & (1 << 15))) out.push("IS_COMPONENTS_V2 flag missing");
  if ("content" in message || "embeds" in message)
    out.push("Components V2 messages cannot set content or embeds");
  const top = message.components ?? [];
  if (!top.length) out.push("message has no components");
  top.forEach((c, i) => {
    if (!DISCORD_TOP_LEVEL.has(c.type)) out.push(`#${i}: type ${c.type} not allowed at top level`);
    discordComponent(c, `#${i}`, out);
  });
  const total = top.reduce((n, c) => n + discordCount(c), 0);
  if (total > 40) out.push(`message has ${total} components (max 40)`);
  const chars = top.reduce((n, c) => n + discordText(c), 0);
  if (chars > 4000) out.push(`message has ${chars} text characters (max 4000)`);
  return out;
}

export function validateDiscordModal(modal: DiscordModal): string[] {
  const out: string[] = [];
  if (!modal.custom_id || modal.custom_id.length > 100) out.push("custom_id must be 1-100 chars");
  if (!modal.title || modal.title.length > 45) out.push("title must be 1-45 chars");
  const rows = modal.components ?? [];
  if (rows.length < 1 || rows.length > 5)
    out.push(`modal has ${rows.length} components (1-5 allowed)`);
  rows.forEach((l: any, i: number) => {
    const where = `#${i}`;
    if (l.type !== 18)
      return out.push(`${where}: modal inputs must be wrapped in a Label (type 18)`);
    if (!l.label || l.label.length > 45) out.push(`${where}: label must be 1-45 chars`);
    if ((l.description ?? "").length > 100) out.push(`${where}: description over 100 chars`);
    const c = l.component ?? {};
    if (c.type === 4) {
      if (!c.custom_id || c.custom_id.length > 100)
        out.push(`${where}: custom_id must be 1-100 chars`);
      if (![1, 2].includes(c.style)) out.push(`${where}: text input style must be 1 or 2`);
      if ("label" in c) out.push(`${where}: text input inside a Label cannot set label`);
      if ((c.value ?? "").length > 4000) out.push(`${where}: value over 4000 chars`);
    } else if (c.type === 3) {
      discordSelect(c, where, out);
    } else {
      out.push(`${where}: unsupported label child type ${c.type}`);
    }
  });
  return out;
}
