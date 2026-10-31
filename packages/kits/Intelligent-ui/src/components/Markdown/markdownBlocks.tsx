import clsx from "clsx";
import { Fragment, type ReactNode } from "react";
import { webUrl } from "../../shared/style";
import { names as linkNames, styles as linkStyles } from "../Link/link.styles";
import { names, styles } from "./markdown.styles";

// A small Markdown renderer that builds React elements and never injects HTML.
// Inline: **bold**, *italic*, ~~strike~~, `code`, [text](https://...).
// Blocks: paragraphs, # headings, - and 1. lists, > quotes, ``` code, ---, | tables |.

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*|__[^_\n]+?__)|(~~[^~\n]+?~~)|(\*[^*\s][^*\n]*?\*|_[^_\s][^_\n]*?_)|(\[[^\]\n]+\]\([^)\s]+\))/;

export function inline(text: string, key = "i"): ReactNode {
  const out: ReactNode[] = [];
  let rest = text;
  let n = 0;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index) out.push(rest.slice(0, m.index));
    const token = m[0];
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<code key={k} className={clsx(styles.code, names.code)}>{token.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k} className={clsx(styles.strong, names.strong)}>{inline(token.slice(2, -2), k)}</strong>);
    else if (m[3]) out.push(<s key={k}>{inline(token.slice(2, -2), k)}</s>);
    else if (m[4]) out.push(<em key={k}>{inline(token.slice(1, -1), k)}</em>);
    else {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = webUrl(token.slice(close + 2, -1));
      out.push(
        href ? (
          <a key={k} className={clsx(linkStyles.root, linkNames.root)} href={href} target="_blank" rel="noopener noreferrer">
            {inline(label, k)}
          </a>
        ) : (
          <Fragment key={k}>{inline(label, k)}</Fragment>
        ),
      );
    }
    rest = rest.slice(m.index + token.length);
  }
  return out.length === 1 ? out[0] : out;
}

type Block =
  | { kind: "p" | "quote"; text: string }
  | { kind: "h"; level: number; text: string }
  | { kind: "list"; ordered: boolean; start: number; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "hr" }
  | { kind: "table"; head: string[]; rows: string[][] };

const LIST_ITEM = /^\s{0,3}([-*+]|(\d+)[.)])\s+(.*)$/;
const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

function blocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const body: string[] = [];
      for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) body.push(lines[i]);
      out.push({ kind: "code", text: body.join("\n") });
      i++;
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      out.push({ kind: "h", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      out.push({ kind: "hr" });
      i++;
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      const head = cells(line);
      const rows: string[][] = [];
      for (i += 2; i < lines.length && lines[i].includes("|") && lines[i].trim(); i++) rows.push(cells(lines[i]));
      out.push({ kind: "table", head, rows });
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      for (; i < lines.length && /^\s*>/.test(lines[i]); i++) body.push(lines[i].replace(/^\s*>\s?/, ""));
      out.push({ kind: "quote", text: body.join(" ") });
      continue;
    }
    const item = LIST_ITEM.exec(line);
    if (item) {
      const ordered = !!item[2];
      const items: string[] = [];
      for (; i < lines.length; i++) {
        const next = LIST_ITEM.exec(lines[i]);
        if (next && !!next[2] === ordered) items.push(next[3]);
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) items[items.length - 1] += ` ${lines[i].trim()}`;
        else break;
      }
      out.push({ kind: "list", ordered, start: ordered ? Number(item[2]) : 1, items });
      continue;
    }
    const body: string[] = [];
    for (; i < lines.length && lines[i].trim() && !LIST_ITEM.test(lines[i]) && !/^(#{1,4})\s|^\s*```|^\s*>/.test(lines[i]); i++) body.push(lines[i].trim());
    out.push({ kind: "p", text: body.join(" ") });
  }
  return out;
}

/** The gap above a block, from the block before it. A rule's own default is 20px. */
function gapBefore(prev: Block | undefined, block: Block): keyof typeof styles.gap | null {
  if (!prev) return null;
  if (prev.kind === "h") return "afterHeading";
  if (block.kind === "h") return "beforeHeading";
  if (block.kind === "hr") return null;
  if (prev.kind === "p" && block.kind === "list") return "list";
  return "normal";
}

export function MarkdownBlocks({ text }: { text: string }) {
  const all = blocks(text);
  return (
    <>
      {all.map((b, i) => {
        const k = `b${i}`;
        const gap = gapBefore(all[i - 1], b);
        const block = clsx(styles.block, names.block, gap && styles.gap[gap]);
        switch (b.kind) {
          case "p":
            return <p key={k} className={block}>{inline(b.text, k)}</p>;
          case "quote":
            return <blockquote key={k} className={clsx(block, styles.quote, names.quote)}>{inline(b.text, k)}</blockquote>;
          case "h": {
            const level = b.level as 1 | 2 | 3 | 4;
            return (
              <div key={k} role="heading" aria-level={b.level + 1} className={clsx(block, styles.heading, names.heading, styles.headingLevel[level], names.headingLevel[level])}>
                {inline(b.text, k)}
              </div>
            );
          }
          case "code":
            return (
              <pre key={k} className={clsx(block, styles.codeBlock, names.codeBlock)}>
                <code>{b.text}</code>
              </pre>
            );
          case "hr":
            return <hr key={k} className={clsx(styles.rule, names.rule, gap && styles.gap[gap])} />;
          case "list": {
            const list = clsx(block, styles.list, names.list);
            const items = b.items.map((t, j) => <li key={j} className={clsx(styles.listItem, names.listItem, b.ordered && styles.orderedItem)}>{inline(t, `${k}-${j}`)}</li>);
            return b.ordered ? (
              <ol key={k} start={b.start} className={list}>
                {items}
              </ol>
            ) : (
              <ul key={k} className={list}>{items}</ul>
            );
          }
          case "table":
            return (
              <div key={k} className={clsx(block, styles.tableScroll, names.tableScroll)}>
                <table className={clsx(styles.table, names.table)}>
                  <thead>
                    <tr>{b.head.map((h, j) => <th key={j} className={clsx(styles.headCell, names.headCell)}>{inline(h, `${k}-h${j}`)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className={clsx(styles.row, names.row)}>{r.map((c, m) => <td key={m} className={clsx(styles.cell, names.cell)}>{inline(c, `${k}-${j}-${m}`)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </>
  );
}
