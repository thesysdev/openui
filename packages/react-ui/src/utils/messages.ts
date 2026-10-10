import {
  lookupArtifactRenderer,
  useArtifactRendererRegistry,
  type Message,
  type ToolActivity,
} from "@openuidev/react-headless";
import { parseMessage, type ParsedMessage } from "@openuidev/react-lang";

type ArtifactRendererRegistry = ReturnType<typeof useArtifactRendererRegistry>;

/** Id of the "live" assistant message in a thread, or null. Shared by the
 *  thread and the assistant component to decide which message is streaming. */
export function getLastAssistantMessageId(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const role = messages[i]?.role;
    if (role === "assistant") return messages[i]!.id;
    if (role === "user") return null;
  }
  return null;
}

/** Activities whose tool has a matched artifact/search renderer — the ones that
 *  render a rich preview outside the raw timeline. */
export function getMatchedRendererActivities(
  registry: ArtifactRendererRegistry,
  activities: ToolActivity[],
): ToolActivity[] {
  return activities.filter((a) => !!(registry && lookupArtifactRenderer(registry, a.toolName)));
}

// OpenUI Cloud's sanitizer retry writes its content line right after the failed attempt's
// last character, with no newline. Start it on its own line so the retry wins.
const RETRY_HEADER = /(?<=[^\n])(?=\]\]>openui:content(?:\?|\r?\n|$))/g;

/** parseMessage, plus older stored XML: `<content version="2">root = A()</content><context>[1]</context>` */
export function readMessage(raw: string, streaming = false): ParsedMessage {
  const parsed = parseMessage(raw.replace(RETRY_HEADER, "\n"), { streaming });
  if (raw.includes("]]>openui:")) return parsed;
  let content = parsed.content;
  let context: unknown = null;
  const contextMatch = content.match(/<context>([\s\S]*)<\/context>\s*$/);
  if (contextMatch) {
    context = contextMatch[1];
    content = content.slice(0, contextMatch.index).trimEnd();
    try {
      context = JSON.parse(contextMatch[1]!);
    } catch {
      // Not JSON: keep the raw text, like parseMessage.
    }
  }
  content = content.match(/^<content[^>]*>([\s\S]*)<\/content>\s*$/)?.[1] ?? content;
  return { ...parsed, content, context };
}

/** True when content has OpenUI Lang: a ```openui-lang fence or an unfenced `root =` line. */
export function hasLangSyntax(content: string | null | undefined): boolean {
  return !!content && (content.includes("```openui-lang") || /(^|\n)\s*root\s*=/.test(content));
}
