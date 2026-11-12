"use client";

import { Fragment, useMemo, useState } from "react";
import {
  columnDecimals,
  deltaTone,
  formatDay,
  formatValue,
  isRateFormat,
  padDecimals,
  parseIsoDate,
  type ValueFormat,
} from "../../../shared/format";
import { useIsomorphicLayoutEffect } from "../../../shared/hooks";
import { columnFormatter } from "../../../shared/scales";
import type { Tone } from "../../../shared/schema";
import { toNumbers } from "../../../shared/values";
import type { GoodWhen } from "../../shared/DeltaBadge";
import { Sparkline } from "../../shared/Sparkline";
import { Empty } from "../../shared/States";
import { StatusIcon } from "../../shared/StatusIcon";

// Text sorts the way people read it: digit runs as numbers, so 4.9.0 comes before 4.10.0
// and "item 2" before "item 10". Same-shaped dates (2026-04-02) still sort by date.
const NATURAL: Intl.CollatorOptions = { numeric: true };

/**
 * What a search matches in a cell: its value and the text a reader sees. A number matches as
 * written (12400) and as the column shows it ($12,400; 12.4K); a date column's value matches as
 * shown (Jul 8, 2020) and as written (2020-07-08); a chip list matches each tag; a boolean matches
 * the true or false its badge shows. Sparklines and states draw marks, not words, so they have
 * nothing to find, and neither does any other value. Data comes from a model or a live API, so
 * the value is checked here rather than trusted to match the column's type.
 */
function searchText(
  column: TableColumn,
  value: unknown,
  shown: (column: TableColumn, value: number) => string,
): string {
  if (value === null || value === undefined) return "";
  if (column.kind === "sparkline" || column.kind === "states") return "";
  if (Array.isArray(value)) return value.filter((tag) => typeof tag === "string").join(" ");
  if (typeof value === "number") {
    const plain =
      column.kind === "delta" || column.kind === "progress"
        ? formatValue(value, column.format ?? "percent")
        : formatValue(value, column.format);
    return `${value} ${plain} ${shown(column, value)}`;
  }
  if (typeof value === "boolean") return String(value);
  if (typeof value !== "string") return "";
  const day = column.kind === "date" ? parseIsoDate(value) : null;
  return day ? `${value} ${formatDay(day)}` : value;
}

/* ---------- Table ---------- */

export interface TableColumn {
  label: string;
  values: (string | number | null | (number | null)[] | (string | null)[])[];
  kind?:
    | "text"
    | "primary"
    | "number"
    | "bar"
    | "delta"
    | "badge"
    | "sparkline"
    | "chip"
    | "date"
    | "progress"
    | "states"
    | "link"
    | "person";
  format?: ValueFormat;
  tones?: Record<string, Tone>;
  goodWhen?: GoodWhen;
  total?: "sum" | "average";
}

export interface TableProps {
  columns: TableColumn[];
  pageSize?: number;
  totals?: boolean;
  search?: string;
  groupBy?: string;
}

/** Page indexes to show, with null for a gap: all of them up to 7, else 1 … around the current page … last. */
function pageList(current: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
  const keep = new Set(
    [0, pages - 1, current - 1, current, current + 1].filter((i) => i >= 0 && i < pages),
  );
  if (current <= 3) [1, 2, 3, 4].forEach((i) => keep.add(i));
  if (current >= pages - 4)
    [pages - 5, pages - 4, pages - 3, pages - 2].forEach((i) => keep.add(i));
  const sorted = [...keep].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((i, n) => {
    if (n > 0 && i - sorted[n - 1]! > 1) out.push(null);
    out.push(i);
  });
  return out;
}

/** A delta's number without its sign or unit word, the part a column pads to one precision. */
const deltaNumber = (value: number, format?: ValueFormat | null) =>
  isRateFormat(format)
    ? formatValue(value, { type: "number", decimals: 1 })
    : formatValue(value, format ?? "percent");

/** A delta cell's text: "+11.4 pts" for a rate, "+11.4%" otherwise, to the column's precision. */
function deltaText(value: number, format?: ValueFormat | null, decimals = 0): string {
  const rate = isRateFormat(format);
  // The same rules as every other delta (computeDelta): hundredths under 0.1, flat only under 0.005.
  const small = Math.abs(value) > 0 && Math.abs(value) < 0.1;
  const number = small
    ? formatValue(value, { type: rate ? "number" : "percent", decimals: 2 })
    : padDecimals(deltaNumber(value, format), decimals);
  return rate ? `${value > 0 ? "+" : ""}${number} pts` : `${value > 0 ? "+" : ""}${number}`;
}

function DeltaCell({
  value,
  format,
  goodWhen,
  decimals = 0,
}: {
  value: number;
  format?: ValueFormat | null;
  goodWhen?: GoodWhen;
  decimals?: number;
}) {
  const text = deltaText(value, format, decimals);
  const direction = Math.abs(value) < 0.005 ? "flat" : value > 0 ? "up" : "down";
  const tone = deltaTone(direction, goodWhen ?? "up");
  return (
    <span
      className={`openui-dashboard-delta openui-dashboard-delta-${tone} openui-dashboard-delta-inline`}
    >
      {text}
    </span>
  );
}

export function Table(props: TableProps) {
  const columns = props.columns;
  const rowCount = Math.max(0, ...columns.map((column) => column.values.length));
  const [sort, setSort] = useState<{ column: number; desc: boolean } | null>(null);
  // Whether more columns sit past the right edge, for the edge fade.
  const [wrap, setWrap] = useState<HTMLDivElement | null>(null);
  const [more, setMore] = useState(false);
  const [back, setBack] = useState(false);
  useIsomorphicLayoutEffect(() => {
    if (!wrap) return;
    const update = () => {
      setMore(wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 2);
      setBack(wrap.scrollLeft > 2);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    wrap.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      wrap.removeEventListener("scroll", update);
    };
  }, [wrap]);
  const [page, setPage] = useState(0);
  const pageSize = props.pageSize ?? 10;

  // Per-column numbers, worked out once per data change rather than once per cell:
  // the largest value (bar cells), the delta precision, and formatters to one precision.
  const perColumn = useMemo(
    () =>
      new Map(
        columns.map((column) => {
          const numbers = column.values.filter((v): v is number => typeof v === "number");
          const formatters = new Map<string, (value: number | null | undefined) => string>();
          return [
            column,
            {
              max: numbers.reduce((top, v) => Math.max(top, v), 0),
              deltaPlaces: columnDecimals(
                numbers.map((v) => deltaNumber(Math.abs(v), column.format)),
              ),
              fmt: (fallback?: ValueFormat) => {
                const key =
                  typeof fallback === "string" ? fallback : JSON.stringify(fallback ?? "");
                if (!formatters.has(key))
                  formatters.set(key, columnFormatter(numbers, column.format ?? fallback));
                return formatters.get(key)!;
              },
            },
          ] as const;
        }),
      ),
    [columns],
  );
  const query = typeof props.search === "string" ? props.search.trim().toLowerCase() : "";
  const order = useMemo(() => {
    // A number's text exactly as its cell shows it, for search.
    const shownNumber = (column: TableColumn, value: number) => {
      const stats = perColumn.get(column);
      if (!stats) return "";
      if (column.kind === "delta") return deltaText(value, column.format, stats.deltaPlaces);
      return stats.fmt(column.kind === "progress" ? "percent" : undefined)(value);
    };
    let indexes = Array.from({ length: rowCount }, (_, i) => i);
    // A search (from a SearchFilter) keeps rows where any cell matches what it shows or holds.
    if (query)
      indexes = indexes.filter((row) =>
        columns.some((column) =>
          searchText(column, column.values[row], shownNumber).toLowerCase().includes(query),
        ),
      );
    if (sort) {
      const values = columns[sort.column]?.values ?? [];
      indexes.sort((a, b) => {
        const x = values[a];
        const y = values[b];
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        // A chip column holds lists: order by the first tag.
        if (Array.isArray(x) || Array.isArray(y)) {
          const first = (v: unknown) => String((Array.isArray(v) ? v[0] : v) ?? "");
          const result = first(x).localeCompare(first(y), undefined, NATURAL);
          return sort.desc ? -result : result;
        }
        const result =
          typeof x === "number" && typeof y === "number"
            ? x - y
            : String(x).localeCompare(String(y), undefined, NATURAL);
        return sort.desc ? -result : result;
      });
    }
    // Grouped: rows gather under their group in order of first appearance,
    // keeping the sort inside each group.
    const groupValues = props.groupBy
      ? columns.find((column) => column.label === props.groupBy)?.values
      : undefined;
    if (groupValues) {
      const rank = new Map<string, number>();
      for (const row of indexes) {
        const key = String(groupValues[row] ?? "—");
        if (!rank.has(key)) rank.set(key, rank.size);
      }
      indexes = [...indexes].sort(
        (a, b) =>
          (rank.get(String(groupValues[a] ?? "—")) ?? 0) -
          (rank.get(String(groupValues[b] ?? "—")) ?? 0),
      );
    }
    return indexes;
  }, [columns, rowCount, sort, query, props.groupBy, perColumn]);
  const groupColumn = props.groupBy
    ? columns.find((column) => column.label === props.groupBy)
    : undefined;
  const groupOf = (row: number) => (groupColumn ? String(groupColumn.values[row] ?? "—") : null);

  if (!columns.length || !rowCount) return <Empty />;
  if (!order.length)
    return <Empty title={`No rows match “${props.search}”`} hint="Try a different search." />;
  const pages = Math.ceil(order.length / pageSize);
  const safePage = Math.min(page, pages - 1);
  const visible = order.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const numeric = (column: TableColumn) =>
    ["number", "bar", "delta", "progress"].includes(
      column.kind ?? (column.values.some((v) => typeof v === "number") ? "number" : "text"),
    );
  const max = (column: TableColumn) => perColumn.get(column)?.max ?? 0;
  // A trend has no single value to order by, so sparkline columns don't sort.
  const sortable = (column: TableColumn) => column.kind !== "sparkline" && column.kind !== "states";
  // "Total" goes in the first column that has no total of its own, never over a number.
  const totalLabelAt = columns.findIndex((column) => !column.total);

  // Every number in a column prints to one precision, across all rows (not just this page),
  // so "35%" reads 35.0% under 27.4%, as in the Leaderboard and Dumbbell.
  const fmt = (column: TableColumn, fallback?: ValueFormat) => perColumn.get(column)!.fmt(fallback);
  const deltaPlaces = (column: TableColumn) => perColumn.get(column)?.deltaPlaces ?? 0;
  const cell = (column: TableColumn, value: unknown) => {
    const kind = column.kind ?? (typeof value === "number" ? "number" : "text");
    if (value === null || value === undefined || value === "")
      return <span className="openui-dashboard-cell-muted">—</span>;
    switch (kind) {
      case "primary":
        return <span className="openui-dashboard-cell-primary">{String(value)}</span>;
      case "badge": {
        const tone: Tone = column.tones?.[String(value)] ?? "neutral";
        // A status chip tinted in its tone: the icon, then the word.
        return (
          <span
            className={`openui-dashboard-cell-chip openui-dashboard-cell-status openui-dashboard-status-${tone}`}
          >
            <StatusIcon tone={tone} bare />
            {String(value)}
          </span>
        );
      }
      case "chip": {
        const tags = (Array.isArray(value) ? value : [value]).filter(
          (tag): tag is string => typeof tag === "string" && tag !== "",
        );
        return (
          <span className="openui-dashboard-cell-chips">
            {tags.map((tag) => (
              <span key={tag} className="openui-dashboard-cell-chip">
                {tag}
              </span>
            ))}
          </span>
        );
      }
      case "date": {
        const day = parseIsoDate(value);
        if (!day) return String(value);
        return <time dateTime={String(value)}>{formatDay(day)}</time>;
      }
      case "link": {
        const href = /^https?:\/\//.test(String(value)) ? String(value) : `https://${value}`;
        const shown = String(value)
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "");
        return (
          <a
            className="openui-dashboard-cell-link"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={href}
          >
            <span>{shown}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M7 17 17 7M8 7h9v9" />
            </svg>
          </a>
        );
      }
      case "person": {
        const name = String(value);
        const initials = name.trim().charAt(0).toUpperCase();
        return (
          <span className="openui-dashboard-cell-person">
            <span className="openui-dashboard-avatar" aria-hidden>
              {initials}
            </span>
            {name}
          </span>
        );
      }
      case "progress": {
        const share = typeof value === "number" ? value : 0;
        return (
          <span className="openui-dashboard-cell-bar">
            <span style={{ minWidth: 40, textAlign: "right" }}>
              {fmt(column, "percent")(share)}
            </span>
            <span className="openui-dashboard-cell-bar-track">
              <span
                className="openui-dashboard-cell-bar-fill openui-dashboard-tex-0"
                style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
              />
            </span>
          </span>
        );
      }
      case "states": {
        const marks = Array.isArray(value) ? value : [];
        const good = marks.filter((mark) => mark === "good").length;
        return (
          <span
            className="openui-dashboard-kpi-status-dots"
            role="img"
            aria-label={`${good} of ${marks.length} good`}
          >
            {marks.map((mark, i) => (
              <span key={i} data-state={typeof mark === "string" ? mark : undefined} />
            ))}
          </span>
        );
      }
      case "sparkline":
        return Array.isArray(value) ? (
          <span style={{ display: "inline-flex", verticalAlign: "middle" }}>
            <Sparkline values={toNumbers(value)} />
          </span>
        ) : null;
      case "delta":
        return typeof value === "number" ? (
          <DeltaCell
            value={value}
            format={column.format}
            goodWhen={column.goodWhen}
            decimals={deltaPlaces(column)}
          />
        ) : (
          String(value)
        );
      case "bar": {
        const top = max(column);
        return (
          <span className="openui-dashboard-cell-bar">
            <span style={{ minWidth: 56, textAlign: "right" }}>
              {typeof value === "number" ? fmt(column)(value) : formatValue(null, column.format)}
            </span>
            <span className="openui-dashboard-cell-bar-track">
              <span
                className="openui-dashboard-cell-bar-fill openui-dashboard-tex-0"
                style={{
                  width: `${top && typeof value === "number" ? (value / top) * 100 : 0}%`,
                }}
              />
            </span>
          </span>
        );
      }
      default:
        return typeof value === "number" ? fmt(column)(value) : String(value);
    }
  };

  return (
    <div className="openui-dashboard-card-body">
      {/* Sideways scrolling, like the legend's up/down stepper: top right of
          the card, level with its title; halves disable at each end. */}
      {more || back ? (
        <div
          className="openui-dashboard-scroll-step openui-dashboard-scroll-step-x openui-dashboard-table-step"
          role="group"
          aria-label="Scroll columns"
        >
          <button
            type="button"
            aria-label="Scroll left"
            disabled={!back}
            onClick={() =>
              wrap?.scrollBy({ left: -Math.max(120, wrap.clientWidth * 0.5), behavior: "smooth" })
            }
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M7.5 3 4.5 6l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            disabled={!more}
            onClick={() =>
              wrap?.scrollBy({ left: Math.max(120, wrap.clientWidth * 0.5), behavior: "smooth" })
            }
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="m4.5 3 3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}
      <div className="openui-dashboard-table-wrap" ref={setWrap} data-more={more ? "" : undefined}>
        <table
          className="openui-dashboard-table"
          // A totals row follows, for the stylesheet: his .table:has(tfoot), which goober can't scope.
          data-totals={props.totals && columns.some((column) => column.total) ? "" : undefined}
        >
          <thead>
            <tr>
              {columns.map((column, c) => (
                <th
                  key={c}
                  className={numeric(column) ? "openui-dashboard-num" : undefined}
                  aria-sort={
                    sort?.column === c ? (sort.desc ? "descending" : "ascending") : undefined
                  }
                >
                  {!sortable(column) ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPage(0);
                        setSort((current) =>
                          current?.column === c
                            ? { column: c, desc: !current.desc }
                            : { column: c, desc: numeric(column) },
                        );
                      }}
                    >
                      {column.label}
                      <span
                        aria-hidden
                        className="openui-dashboard-sort"
                        data-asc={sort?.column === c && !sort.desc ? "" : undefined}
                      >
                        <svg viewBox="0 0 12 12" fill="none">
                          <path
                            d="M6 2.5v7M6 9.5 3 6.5M6 9.5l3-3"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <Fragment key={row}>
                {groupColumn && (i === 0 || groupOf(visible[i - 1]!) !== groupOf(row)) ? (
                  <tr className="openui-dashboard-table-group">
                    <td colSpan={columns.length}>
                      {/* The label stays pinned to the left edge while columns scroll. */}
                      <span className="openui-dashboard-group-label">
                        {groupOf(row)}
                        <span>
                          {order.filter((other) => groupOf(other) === groupOf(row)).length}
                        </span>
                      </span>
                    </td>
                  </tr>
                ) : null}
                <tr
                  // Marks the row a group band follows, for the stylesheet: his
                  // tr:has(+ tr.table-group) td, which goober can't scope.
                  data-before-group={
                    groupColumn &&
                    i < visible.length - 1 &&
                    groupOf(visible[i + 1]!) !== groupOf(row)
                      ? ""
                      : undefined
                  }
                >
                  {columns.map((column, c) => (
                    <td key={c} className={numeric(column) ? "openui-dashboard-num" : undefined}>
                      {c === 0 ? (
                        // The frozen column is capped so one long name can't crowd out the rest.
                        <span
                          className="openui-dashboard-cell-clip"
                          title={
                            typeof column.values[row] === "string"
                              ? (column.values[row] as string)
                              : undefined
                          }
                        >
                          {cell(column, column.values[row])}
                        </span>
                      ) : (
                        cell(column, column.values[row])
                      )}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
            {/* With a totals row, this empty row takes the card's spare height, so the totals sit at the bottom. */}
            {props.totals && columns.some((column) => column.total) ? (
              <tr className="openui-dashboard-table-spacer" aria-hidden>
                <td colSpan={columns.length} />
              </tr>
            ) : null}
          </tbody>
          {props.totals && columns.some((column) => column.total) ? (
            <tfoot>
              <tr aria-label="Totals">
                {columns.map((column, c) => {
                  const numbers = order
                    .map((row) => column.values[row])
                    .filter((v): v is number => typeof v === "number");
                  const sum = numbers.reduce((total, v) => total + v, 0);
                  const value =
                    column.total === "sum"
                      ? sum
                      : column.total === "average" && numbers.length
                        ? sum / numbers.length
                        : null;
                  return (
                    <td key={c} className={numeric(column) ? "openui-dashboard-num" : undefined}>
                      {c === totalLabelAt ? "Total" : value !== null ? fmt(column)(value) : ""}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {pages > 1 ? (
        // Compact and right-aligned: previous, the page numbers, next.
        <nav
          className="openui-dashboard-table-pager"
          aria-label={`Rows ${safePage * pageSize + 1}–${Math.min(order.length, (safePage + 1) * pageSize)} of ${order.length}`}
        >
          <button
            type="button"
            className="openui-dashboard-pager-step"
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage(safePage - 1)}
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="M7.5 3 4.5 6l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <span className="openui-dashboard-pager-pages">
            {pageList(safePage, pages).map((item, i) =>
              item === null ? (
                <span key={`gap-${i}`} className="openui-dashboard-pager-gap" aria-hidden>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className="openui-dashboard-pager-page"
                  aria-current={item === safePage ? "page" : undefined}
                  aria-label={`Page ${item + 1}`}
                  onClick={() => setPage(item)}
                >
                  {item + 1}
                </button>
              ),
            )}
          </span>
          <button
            type="button"
            className="openui-dashboard-pager-step"
            aria-label="Next page"
            disabled={safePage >= pages - 1}
            onClick={() => setPage(safePage + 1)}
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="m4.5 3 3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>
      ) : null}
    </div>
  );
}
