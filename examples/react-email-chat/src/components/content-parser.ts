export function wrapContent(text: string): string {
  return `<content>${text}</content>`;
}

export function wrapContext(json: string): string {
  return `<context>${json}</context>`;
}

export function separateContentAndContext(raw: string) {
  const contextMatch = raw.match(/<context>([\s\S]*)<\/context>\s*$/);
  let content = raw;
  let contextString: string | null = null;
  if (contextMatch) {
    content = raw.slice(0, contextMatch.index).trimEnd();
    contextString = contextMatch[1] ?? null;
  }
  return { content, contextString };
}
