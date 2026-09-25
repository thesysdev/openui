import { createParser } from "@openuidev/lang-core";
import { libraryRoot, librarySchema } from "./openui-prompt";

const parser = createParser(librarySchema(), libraryRoot());
const ROOT_CANDIDATE = /(?:^|[^A-Za-z0-9_$])root[\t ]*=/g;
const MAX_STREAM_CHUNKS = 72;
const MIN_STREAM_CHUNK_SIZE = 192;

function startsSingleQuotedString(value: string, index: number): boolean {
  let previous = index - 1;
  while (previous >= 0 && /[\t ]/.test(value[previous])) previous -= 1;
  if (previous < 0) return true;
  return /[([{:?,=+\-*/%!<>]/.test(value[previous]);
}

function scanQuoteState(
  value: string,
  initialQuote?: '"' | "'",
): '"' | "'" | undefined {
  let quote = initialQuote;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }

    if (character === '"') {
      quote = character;
    } else if (
      character === "'" &&
      startsSingleQuotedString(value, index)
    ) {
      // Ignore prose apostrophes and possessives while still
      // protecting fenced-looking text inside single-quoted OpenUI strings.
      quote = character;
    }
  }

  return quote;
}

interface FencedBlock {
  value: string;
  start: number;
  end: number;
}

/** Extract Markdown code blocks while ignoring fence markers inside strings. */
function fencedBlocks(value: string): FencedBlock[] {
  const blocks: FencedBlock[] = [];
  const lines = value.match(/.*(?:\n|$)/g) ?? [];
  let quote: '"' | "'" | undefined;
  let block: string[] | undefined;
  let blockStart = 0;
  let offset = 0;

  for (const line of lines) {
    if (!line) continue;
    const lineStart = offset;
    offset += line.length;
    const withoutNewline = line.replace(/\r?\n$/, "");

    if (!block) {
      if (!quote && /^[\t ]{0,3}```[^`\r\n]*$/.test(withoutNewline)) {
        block = [];
        blockStart = offset;
        quote = undefined;
        continue;
      }
      quote = scanQuoteState(line, quote);
      continue;
    }

    if (!quote && /^[\t ]{0,3}```+[\t ]*$/.test(withoutNewline)) {
      blocks.push({ value: block.join(""), start: blockStart, end: lineStart });
      block = undefined;
      quote = undefined;
      continue;
    }

    block.push(line);
    quote = scanQuoteState(line, quote);
  }

  // Match lang-core's streaming behavior: an unclosed fence owns the rest.
  if (block) blocks.push({ value: block.join(""), start: blockStart, end: value.length });
  return blocks;
}

function isInsideLineComment(value: string, index: number): boolean {
  const lineStart = value.lastIndexOf("\n", index - 1) + 1;
  let quote: '"' | "'" | undefined;
  let escaped = false;

  for (let cursor = lineStart; cursor < index; cursor += 1) {
    const character = value[cursor];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "#") return true;
    else if (character === "/" && value[cursor + 1] === "/") return true;
  }
  return false;
}

function rootCandidateIndexes(value: string): number[] {
  const indexes: number[] = [];
  for (const match of value.matchAll(ROOT_CANDIDATE)) {
    const rootOffset = match[0].indexOf("root");
    const index = match.index + rootOffset;
    if (!isInsideLineComment(value, index)) indexes.push(index);
  }
  return indexes;
}

function isRootCandidateAt(value: string, index: number): boolean {
  if (!value.startsWith("root", index)) return false;
  const previous = value[index - 1];
  if (previous && /[A-Za-z0-9_$]/.test(previous)) return false;

  let cursor = index + "root".length;
  while (value[cursor] === " " || value[cursor] === "\t") cursor += 1;
  return value[cursor] === "=";
}

/** Isolate one structurally complete candidate without crossing into a later root. */
function candidateAt(value: string, start: number): string | undefined {
  let quote: '"' | "'" | undefined;
  let escaped = false;
  let lineComment = false;
  let parentheses = 0;
  let brackets = 0;
  let braces = 0;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = undefined;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "#" || (character === "/" && value[index + 1] === "/")) {
      lineComment = true;
      continue;
    }

    // OpenUI escapes only occur inside quoted strings. Seeing one here means
    // this root was probably recovered from an escaped example inside a string.
    if (character === "\\") return undefined;

    const atTopLevel = parentheses === 0 && brackets === 0 && braces === 0;
    if (index > start && atTopLevel) {
      if (value.startsWith("```", index) || isRootCandidateAt(value, index)) {
        return value.slice(start, index);
      }
    }

    if (character === "(") parentheses += 1;
    else if (character === ")") parentheses -= 1;
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets -= 1;
    else if (character === "{") braces += 1;
    else if (character === "}") braces -= 1;

    if (parentheses < 0 || brackets < 0 || braces < 0) return undefined;
  }

  if (quote || parentheses !== 0 || brackets !== 0 || braces !== 0) return undefined;
  return value.slice(start);
}

function normalizeCandidate(value: string): string {
  return value
    .trim()
    .replace(/\n[\t ]*```[\t ]*$/, "")
    .trim();
}

export function isRenderableOpenUI(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const result = parser.parse(value);
    return (
      result.root?.typeName === "Stack" &&
      !result.meta.incomplete &&
      result.meta.errors.length === 0 &&
      result.meta.unresolved.length === 0
    );
  } catch {
    return false;
  }
}

export function createOpenUIStatus(
  variant: "neutral" | "info" | "warning" | "success" | "error",
  title: string,
  description: string,
): string {
  return [
    "root = Stack([notice])",
    `notice = Callout(${JSON.stringify(variant)}, ${JSON.stringify(title)}, ${JSON.stringify(description)})`,
  ].join("\n");
}

function issueText(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** Parser feedback suitable for a bounded model correction turn. */
export function describeOpenUIProblems(value: string): string[] {
  if (!value.trim()) return ["The response was empty."];
  try {
    const result = parser.parse(value);
    const issues = result.meta.errors.map(issueText);
    issues.push(...result.meta.unresolved.map((name) => `Unresolved reference: ${name}`));
    if (!result.root) issues.push("No renderable root component was produced.");
    else if (result.root.typeName !== "Stack") {
      issues.push(`The root component must be Stack, not ${result.root.typeName}.`);
    }
    if (result.meta.incomplete) issues.push("The OpenUI program is incomplete.");
    return [...new Set(issues)];
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}

function fallbackOpenUI(value: string): string {
  const detail = describeOpenUIProblems(value)[0] ?? "The final program was invalid.";
  return createOpenUIStatus(
    "warning",
    "Unable to render Grok Build response",
    `The final OpenUI response did not pass validation. ${detail}`,
  );
}

interface RenderableCandidate {
  value: string;
  index: number;
}

function latestRenderableRootCandidate(
  value: string,
  acceptsIndex: (index: number) => boolean = () => true,
): RenderableCandidate | undefined {
  const normalized = normalizeCandidate(value);
  const indexes = rootCandidateIndexes(normalized);
  for (let index = indexes.length - 1; index >= 0; index -= 1) {
    if (!acceptsIndex(indexes[index])) continue;
    const extracted = candidateAt(normalized, indexes[index]);
    if (!extracted) continue;
    const candidate = normalizeCandidate(extracted);
    if (isRenderableOpenUI(candidate)) {
      return { value: candidate, index: indexes[index] };
    }
  }
  return undefined;
}

function latestRenderableCandidate(value: string): string | undefined {
  const normalized = normalizeCandidate(value);

  const blocks = fencedBlocks(normalized);
  const candidates: RenderableCandidate[] = [];

  for (const block of blocks) {
    const candidate = latestRenderableRootCandidate(block.value);
    if (candidate) {
      candidates.push({
        value: candidate.value,
        index: block.start + candidate.index,
      });
    }
  }

  const rawCandidate = latestRenderableRootCandidate(normalized, (index) => {
    if (blocks.some((block) => index >= block.start && index < block.end)) {
      return false;
    }

    const lineStart = normalized.lastIndexOf("\n", index - 1) + 1;
    const startsOnOwnLine = normalized.slice(lineStart, index).trim() === "";
    const followsFence = blocks.some((block) => block.end <= index);
    const previousCharacter = normalized[index - 1];
    const followsCompletedExpression = Boolean(
      previousCharacter && /[)\]}]/.test(previousCharacter),
    );

    // After an explicit fenced program, same-line `root =` text is usually a
    // syntax reminder in prose. A later answer beginning on its own line still
    // wins by source order. So does a root jammed directly after a completed
    // expression, which is how split ACP retry chunks appeared in production.
    return startsOnOwnLine || !followsFence || followsCompletedExpression;
  });
  if (rawCandidate) candidates.push(rawCandidate);

  candidates.sort((left, right) => right.index - left.index);
  return candidates[0]?.value;
}

/**
 * Collects append-only ACP message chunks while making retries safe. Grok can
 * emit progress prose and several complete candidates during one prompt. ACP
 * may split the next `root =` across chunks without inserting a newline, so
 * candidate boundaries are retained here and resolved by validation at finish.
 */
export class OpenUIOutputAccumulator {
  private lastRenderable = "";
  private value = "";

  push(delta: string): void {
    this.value += delta;
  }

  retry(): void {
    const renderable = latestRenderableCandidate(normalizeCandidate(this.value));
    if (renderable) this.lastRenderable = renderable;
    this.value = "";
  }

  /** Clear an invalid attempt before a model correction without promoting it. */
  resetForCorrection(): void {
    this.value = "";
  }

  hasRenderable(): boolean {
    return Boolean(
      latestRenderableCandidate(normalizeCandidate(this.value)) || this.lastRenderable,
    );
  }

  hasOutput(): boolean {
    return Boolean(this.value.trim() || this.lastRenderable);
  }

  needsCorrection(): boolean {
    return Boolean(this.value.trim()) && !this.hasRenderable();
  }

  correctionPrompt(): string {
    const candidate = normalizeCandidate(this.value);
    const issues = describeOpenUIProblems(candidate);
    return [
      "Your previous final assistant response failed OpenUI validation.",
      "Do not call tools. Return exactly one corrected OpenUI Lang program and nothing else.",
      "Keep the same factual answer. Ensure every reference used by root and child components is defined.",
      "Validation issues:",
      ...issues.map((issue) => `- ${issue}`),
      "Invalid OpenUI Lang:",
      "```openui",
      candidate.slice(0, 12_000),
      "```",
    ].join("\n");
  }

  finish(): string {
    const candidate = normalizeCandidate(this.value);
    const renderable = latestRenderableCandidate(candidate);
    if (renderable) return renderable;
    if (this.lastRenderable) return this.lastRenderable;
    if (!candidate) {
      return createOpenUIStatus(
        "warning",
        "No final response",
        "Grok Build completed without producing an assistant response.",
      );
    }
    return fallbackOpenUI(candidate);
  }
}

/** Split validated output into at most ~72 pieces for a short, frame-paced reveal. */
export function chunkOpenUIOutput(value: string): string[] {
  if (!value) return [];
  const targetSize = Math.max(
    MIN_STREAM_CHUNK_SIZE,
    Math.ceil(value.length / MAX_STREAM_CHUNKS),
  );
  const chunks: string[] = [];

  for (let start = 0; start < value.length; ) {
    let end = Math.min(start + targetSize, value.length);
    const nearbyNewline = value.indexOf("\n", end);
    if (nearbyNewline !== -1 && nearbyNewline - end <= 96) end = nearbyNewline + 1;
    if (end < value.length && /[\uD800-\uDBFF]/.test(value[end - 1]!)) end -= 1;
    chunks.push(value.slice(start, end));
    start = end;
  }

  return chunks;
}
