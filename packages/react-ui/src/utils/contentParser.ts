const openTag = (tag: string) => `<${tag}>`;
const closeTag = (tag: string) => `</${tag}>`;

export function wrapContent(text: string): string {
  return `${openTag("content")}${text}${closeTag("content")}`;
}

export function wrapContext(json: string): string {
  return `${openTag("context")}${json}${closeTag("context")}`;
}

/**
 * Separate openui-lang code from <context> tag in a message.
 * Returns { content: the message/code, contextString: raw JSON or null }
 */
export function separateContentAndContext(raw: string): {
  content: string;
  contextString: string | null;
} {
  const contextMatch = raw.match(/<context>([\s\S]*)<\/context>\s*$/);
  let content = raw;
  let contextString: string | null = null;

  if (contextMatch) {
    contextString = contextMatch[1] ?? null;
    content = raw.slice(0, contextMatch.index!).trimEnd();
  }

  const contentMatch = content.match(/^<content[^>]*>([\s\S]*)<\/content>\s*$/);
  if (contentMatch) {
    content = contentMatch[1] ?? content;
  }

  return { content, contextString };
}
