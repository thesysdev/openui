import { parseMessage } from "@openuidev/lang-core";

/** Metadata emitted by OpenUI Cloud. */
export interface ResponseMetadata {
  name?: string;
}

// OpenUI Cloud writes each script as a fence after the program: "```openui-js sales_total", the
// code, then a line of at least as many backticks. Other `openui-*` tags are future script kinds:
// stripped, not run. ```openui-lang is the program's own fence and stays in it.
const FENCE_OPEN = /^(`{3,})(openui-[\w-]+)(?: (.*))?$/;
const PROGRAM_FENCE = "openui-lang";
const JS_FENCE = "openui-js";
// This file cuts the scripts out; parseMessage reads the rest (content, attributes, end).
const CONTENT_LINE = /^\]\]>openui:content(?:\?.*)?\r?$(\n?)/m;

interface Scripts {
  names: Set<string>;
  revision: string;
}

// Script names must be unique; the revision changes with any script's name or code.
function toScripts(values: unknown[]): Scripts | null {
  const names = new Set<string>();
  for (const script of values as { name?: unknown; code?: unknown }[]) {
    if (
      !script ||
      typeof script.name !== "string" ||
      !script.name ||
      typeof script.code !== "string" ||
      names.has(script.name)
    )
      return null;
    names.add(script.name);
  }
  const revision = JSON.stringify(
    (values as { name: string; code: string }[])
      .map((script) => ({ name: script.name, code: script.code }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
  return { names, revision };
}

// While streaming, a last line like "``" or "```openui-" may still become a fence opener.
function mayOpen(line: string): boolean {
  const rest = line.replace(/^`+/, "");
  const ticks = line.length - rest.length;
  return ticks > 0 && (rest === "" || (ticks >= 3 && `${JS_FENCE} `.startsWith(rest)));
}

/**
 * Cuts ```openui-* fences out of the program; `fenced` once there is one. `growing` when the
 * content's last line is the stream's, still without its newline.
 */
function readFences(content: string, streaming: boolean, growing: boolean) {
  const lines = content.split("\n");
  const held = growing && mayOpen(lines[lines.length - 1].replace(/\r$/, ""));
  if (held) lines.pop();
  const kept: string[] = [];
  const values: { name?: string; code: string }[] = [];
  let fenced = false;
  let valid = true;
  for (let i = 0; i < lines.length; i++) {
    const open = FENCE_OPEN.exec(lines[i].replace(/\r$/, ""));
    // A last line like "```openui-la" may still become the program's fence.
    const partial = growing && !held && i === lines.length - 1 && !open?.[3];
    if (!open || open[2] === PROGRAM_FENCE || (partial && PROGRAM_FENCE.startsWith(open[2]))) {
      kept.push(lines[i]);
      continue;
    }
    fenced = true;
    // The newline (and its `\r`) before a fence is not part of the program.
    if (kept.length) kept[kept.length - 1] = kept[kept.length - 1].replace(/\r$/, "");
    const closer = new RegExp(`^\`{${open[1].length},}\r?$`);
    let end = i + 1;
    while (end < lines.length && !closer.test(lines[end])) end++;
    // An open fence is a script still streaming; once settled, the response was cut off.
    if (end === lines.length) valid &&= streaming;
    else if (open[2] === JS_FENCE) {
      const name = open[3] && /^\S+$/.test(open[3]) ? open[3] : undefined;
      const code = lines.slice(i + 1, end).map((line) => line.replace(/\r$/, ""));
      values.push({ name, code: code.join("\n") });
    }
    i = end;
    // As before a fence, the newline after the last one is not part of the program.
    if (i === lines.length - 2 && lines[i + 1] === "") break;
  }
  return { program: kept.join("\n"), fenced, scripts: valid ? toScripts(values) : null };
}

/** Reads an OpenUI Cloud response: a stored message (see parseMessage) plus its scripts. */
export function parseResponseBundle(response: string | null, streaming: boolean) {
  const text = response ?? "";
  // Framed once a content line is in. A line still streaming does not count yet.
  const line = CONTENT_LINE.exec(text);
  const framed = !!line && (!streaming || line[1] === "\n");
  const { content, attributes, end } = parseMessage(text, { streaming });
  const last = text.slice(text.lastIndexOf("\n") + 1);
  const {
    program,
    fenced: section,
    scripts,
  } = readFences(content, streaming, streaming && !!last && content.endsWith(last));

  const metadata: ResponseMetadata = {};
  if (!framed && !section && !end) {
    const error: string | undefined = undefined;
    return {
      program,
      metadata,
      scripts: new Set<string>(),
      complete: true,
      isBundle: false,
      error,
    };
  }
  if (framed && attributes.name !== undefined) metadata.name = attributes.name;
  const error = section && !scripts ? "Invalid scripts bundle" : undefined;
  return {
    program,
    metadata,
    scripts: scripts?.names ?? new Set<string>(),
    // The end line only says the response is finished, so a stored message renders without one.
    // While streaming, a framed response is complete at its end line.
    complete: !error && (end || !streaming || !framed),
    isBundle: true,
    error: streaming ? undefined : error,
    ...(scripts?.names.size ? { scriptRevision: scripts.revision } : {}),
  };
}
