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
 * Each validator returns a list of problems; empty list = pass.
 */
import { validateBlockKit } from "@tightknitai/slack-block-kit-validator";
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
