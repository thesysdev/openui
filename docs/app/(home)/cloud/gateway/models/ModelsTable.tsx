"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Info,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { iconFor } from "./model-icons";
import styles from "./page.module.css";

const MODELS_URL = "https://openrouter.ai/api/v1/models";

// Must match the free-model allowlist in the Billing promotion config.
const FREE_MODELS = [
  { id: "google/gemini-4-argon-free", base: "google/gemini-4-argon" },
  { id: "google/gemini-3.6-flash-free", base: "google/gemini-3.6-flash" },
  { id: "google/gemini-3.5-flash-free", base: "google/gemini-3.5-flash" },
  { id: "google/gemini-3.1-pro-free", base: "google/gemini-3.1-pro-preview" },
  { id: "google/gemini-3.1-flash-lite-free", base: "google/gemini-3.1-flash-lite" },
];

const PROVIDERS = [
  { group: "openai", prefix: "openai/", label: "OpenAI" },
  { group: "anthropic", prefix: "anthropic/", label: "Anthropic" },
  { group: "gemini", prefix: "google/gemini", label: "Gemini" },
] as const;

type ModelGroup = (typeof PROVIDERS)[number]["group"] | "other";

type Model = {
  id: string;
  name: string;
  created: number;
  context_length: number | null;
  pricing: { prompt?: string; completion?: string };
  architecture: { output_modalities: string[] };
};

// Alias IDs such as "~openai/gpt-sol-latest" carry a leading "~".
const slugOf = (id: string) => id.replace(/^~/, "");

const groupOf = (m: Model): ModelGroup =>
  PROVIDERS.find((p) => slugOf(m.id).startsWith(p.prefix))?.group ?? "other";

// Drops batch variants, OpenAI/Anthropic/Gemini "-latest" aliases, OpenAI pro/chat/codex/oss variants,
// and models that can output images or audio.
// OpenRouter has no field that marks these variants, so the ID is the only signal.
// OpenAI, Anthropic, and Gemini models use Zero Data Retention, except Claude Fable.
const isZdr = (m: Model) => !m.id.includes("claude-fable");

const isListed = (m: Model) =>
  !m.id.endsWith(":batch") &&
  !/^~?(openai\/|anthropic\/|google\/gemini).*-latest$/.test(m.id) &&
  !/^openai\/(.+-pro$|gpt-oss|.*(chat|codex))/.test(m.id) &&
  m.architecture.output_modalities.every((modality) => modality === "text");

// Each request runs once per page view and every table shares it. A failure allows a retry.
function sharedRequest<T>(load: () => Promise<T>) {
  let request: Promise<T> | undefined;
  return () =>
    (request ??= load().catch((error: unknown) => {
      request = undefined;
      throw error;
    }));
}

async function getJson<T>(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

const getModels = sharedRequest(() =>
  getJson<{ data: Model[] }>(MODELS_URL).then(({ data }) => data),
);

function useRequest<T>(get: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    get()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [get]);

  return { data, failed };
}

const fullNumber = new Intl.NumberFormat("en-US");
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const releaseDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

// OpenRouter prices are USD per token. Routers with dynamic pricing report "-1".
function formatPrice(perToken?: string) {
  if (perToken === undefined) return "-";
  const value = Number(perToken);
  if (value < 0) return "Varies";
  if (value === 0) return "Free";
  return usd.format(value * 1_000_000);
}

const formatContext = (tokens?: number | null) => (tokens ? fullNumber.format(tokens) : "-");

type SortKey = "name" | "context" | "input" | "output" | "zdr" | "released";
type Sort = { key: SortKey; dir: "asc" | "desc" };

// Fixed column widths keep the table from resizing when search, sorting, or show more change the rows.
const COLUMNS: { key: SortKey; label: string; align?: string; width?: string }[] = [
  { key: "name", label: "Model" },
  { key: "context", label: "Context", align: styles.numeric, width: styles.colContext },
  { key: "input", label: "Input", align: styles.numeric, width: styles.colPrice },
  { key: "output", label: "Output", align: styles.numeric, width: styles.colPrice },
  { key: "zdr", label: "ZDR", align: styles.center, width: styles.colZdr },
  { key: "released", label: "Released", align: styles.numeric, width: styles.colDate },
];

const priceValue = (perToken?: string) => {
  const value = Number(perToken);
  return perToken === undefined || value < 0 ? undefined : value;
};

function sortValue(m: Model, key: SortKey): string | number | undefined {
  switch (key) {
    case "name":
      return m.name.toLowerCase();
    case "context":
      return m.context_length ?? undefined;
    case "input":
      return priceValue(m.pricing.prompt);
    case "output":
      return priceValue(m.pricing.completion);
    case "zdr":
      return Number(isZdr(m));
    case "released":
      return m.created;
  }
}

// Missing values and variable pricing sort last in both directions.
function compareModels(a: Model, b: Model, sort: Sort) {
  const x = sortValue(a, sort.key);
  const y = sortValue(b, sort.key);
  if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? 1 : -1;
  const order = x < y ? -1 : x > y ? 1 : 0;
  return sort.dir === "asc" ? order : -order;
}

// Tables grow when the model list loads, which moves the browser's initial #anchor scroll off target.
function useScrollToHashOnLoad(loaded: boolean) {
  useEffect(() => {
    if (!loaded || !window.location.hash) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [loaded]);
}

export function FreeModelsTable() {
  const { data: models } = useRequest(getModels);
  useScrollToHashOnLoad(models !== null);
  const byId = useMemo(() => new Map((models ?? []).map((m) => [m.id, m])), [models]);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <colgroup>
          <col />
          <col className={styles.colContext} />
          <col className={styles.colZdr} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Model</th>
            <th scope="col" className={styles.numeric}>
              Context
            </th>
            <th scope="col" className={styles.center}>
              ZDR
            </th>
          </tr>
        </thead>
        <tbody>
          {FREE_MODELS.map(({ id, base }) => {
            const baseModel = byId.get(base);
            return (
              <tr key={id}>
                <td>
                  <ModelCell id={id} name={baseModel?.name ?? base} />
                </td>
                <td className={styles.numeric} data-label="Context">
                  {formatContext(baseModel?.context_length)}
                </td>
                <td className={styles.center} data-label="ZDR">
                  <span className={styles.zdrNote}>
                    <ZdrMark zdr={false} />
                    <InfoTip text="Data may be retained for training." />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Without `preview`, the table shows every model and no show more row.
 * With `pageSize`, the expanded table is split into pages of that size.
 */
export function ModelsTable({
  group,
  preview,
  pageSize,
}: {
  group: ModelGroup;
  preview?: number;
  pageSize?: number;
}) {
  const { data: allModels, failed } = useRequest(getModels);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "released", dir: "desc" });
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);

  const models = useMemo(
    () => allModels?.filter((m) => isListed(m) && groupOf(m) === group) ?? null,
    [allModels, group],
  );

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );
    setPage(0);
  };

  const rows = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return (models ?? [])
      .filter((m) => {
        const text = `${m.id} ${m.name}`.toLowerCase();
        return terms.every((term) => text.includes(term));
      })
      .sort((a, b) => compareModels(a, b, sort));
  }, [models, query, sort]);

  const limit = preview ?? rows.length;
  const perPage = expanded && pageSize ? pageSize : rows.length;
  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, pageCount - 1);
  const start = current * perPage;
  const visibleRows = expanded ? rows.slice(start, start + perPage) : rows.slice(0, limit);
  const canToggle = expanded || rows.length > limit;
  const label = PROVIDERS.find((p) => p.group === group)?.label ?? "other";
  // Only the OpenAI, Anthropic, and Gemini tables have a ZDR column.
  const showZdr = group !== "other";
  const columns = showZdr ? COLUMNS : COLUMNS.filter((c) => c.key !== "zdr");

  return (
    <div className={styles.models}>
      <label className={styles.search}>
        <Search aria-hidden="true" size={16} className={styles.searchIcon} />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search models"
          aria-label={`Search ${label} models by name or ID`}
          className={styles.searchInput}
        />
      </label>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <colgroup>
            {columns.map((c) => (
              <col key={c.key} className={c.width} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort.key === c.key;
                const SortIcon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={c.align}
                    aria-sort={
                      active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined
                    }
                  >
                    <button
                      type="button"
                      className={styles.sortButton}
                      data-active={active}
                      onClick={() => toggleSort(c.key)}
                    >
                      {c.label}
                      <SortIcon aria-hidden="true" size={14} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {failed ? (
              <StatusRow span={columns.length}>
                Could not load the model list. View the{" "}
                <a href="https://openrouter.ai/models">model list on OpenRouter</a> instead.
              </StatusRow>
            ) : !models ? (
              <StatusRow span={columns.length}>Loading models...</StatusRow>
            ) : rows.length === 0 ? (
              <StatusRow span={columns.length}>No models match your search.</StatusRow>
            ) : (
              visibleRows.map((m) => (
                <ModelRow key={m.id} model={m} zdr={showZdr ? isZdr(m) : undefined} />
              ))
            )}
            {models && canToggle ? (
              <tr>
                <td colSpan={columns.length}>
                  <button
                    type="button"
                    className={styles.toggle}
                    aria-expanded={expanded}
                    onClick={() => {
                      setExpanded(!expanded);
                      setPage(0);
                    }}
                  >
                    {expanded ? (
                      <ChevronUp aria-hidden="true" size={16} />
                    ) : (
                      <ChevronDown aria-hidden="true" size={16} />
                    )}
                    {expanded ? "Show less" : `Show ${rows.length - limit} more`}
                  </button>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className={styles.pagination}>
          <span>
            {start + 1}-{start + visibleRows.length} of {rows.length}
          </span>
          <div className={styles.pageControls}>
            <button
              type="button"
              className={styles.pageButton}
              aria-label="Previous page"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft aria-hidden="true" size={16} />
            </button>
            <span>
              Page {current + 1} of {pageCount}
            </span>
            <button
              type="button"
              className={styles.pageButton}
              aria-label="Next page"
              disabled={current === pageCount - 1}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** `zdr` is undefined when the table has no ZDR column. */
function ModelRow({ model, zdr }: { model: Model; zdr?: boolean }) {
  const input = formatPrice(model.pricing.prompt);
  const output = formatPrice(model.pricing.completion);

  return (
    <tr>
      <td>
        <ModelCell id={model.id} name={model.name} />
      </td>
      <td className={styles.numeric} data-label="Context">
        {formatContext(model.context_length)}
      </td>
      <td className={`${styles.numeric} ${input === "Free" ? styles.free : ""}`} data-label="Input">
        {input}
      </td>
      <td
        className={`${styles.numeric} ${output === "Free" ? styles.free : ""}`}
        data-label="Output"
      >
        {output}
      </td>
      {zdr !== undefined ? (
        <td className={styles.center} data-label="ZDR">
          <ZdrMark zdr={zdr} />
        </td>
      ) : null}
      <td className={`${styles.numeric} ${styles.muted}`} data-label="Released">
        {releaseDate.format(model.created * 1000)}
      </td>
    </tr>
  );
}

function ModelCell({ id, name }: { id: string; name: string }) {
  const icon = iconFor(id);

  return (
    <div className={styles.model}>
      <span className={styles.mark} aria-hidden="true">
        {!icon ? (
          slugOf(id).charAt(0).toUpperCase()
        ) : icon.mono ? (
          <span
            className={styles.markIcon}
            style={{ maskImage: `url(${icon.src})`, WebkitMaskImage: `url(${icon.src})` }}
          />
        ) : (
          <Image src={icon.src} alt={`${slugOf(id)} logo`} width={16} height={16} unoptimized />
        )}
      </span>
      <div className={styles.modelText}>
        <span className={styles.modelName}>{name}</span>
        <ModelId id={id} />
      </div>
    </div>
  );
}

function ModelId({ id }: { id: string }) {
  const [copied, onCopy] = useCopyButton(() => navigator.clipboard.writeText(id));

  return (
    <button
      type="button"
      className={styles.modelId}
      aria-label={copied ? `Copied ${id}` : `Copy ${id}`}
      onClick={onCopy}
    >
      <code>{id}</code>
      {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
    </button>
  );
}

function ZdrMark({ zdr }: { zdr: boolean }) {
  return zdr ? (
    <>
      <Check aria-hidden="true" size={16} className={styles.zdrYes} />
      <span className={styles.srOnly}>Yes</span>
    </>
  ) : (
    <>
      <X aria-hidden="true" size={16} className={styles.zdrNo} />
      <span className={styles.srOnly}>No</span>
    </>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className={styles.infoButton} aria-label={text}>
            <Info aria-hidden="true" size={14} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            collisionPadding={12}
            className={styles.tooltip}
          >
            {text}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

function StatusRow({ children, span }: { children: ReactNode; span: number }) {
  return (
    <tr>
      <td colSpan={span} className={styles.status}>
        {children}
      </td>
    </tr>
  );
}
