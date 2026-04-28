const OPENUI_INLINE_SENTINEL = "]]>openui:";
const CONTENT_MARKER = `${OPENUI_INLINE_SENTINEL}content`;
const CONTEXT_MARKER = `${OPENUI_INLINE_SENTINEL}context`;

export function wrapContent(text: string): string {
  return `${CONTENT_MARKER}\n${text}`;
}

// Reuse the original assistant header so attrs survive form-state persistence.
export function wrapContentWithHeader(text: string, contentHeader?: string): string {
  return contentHeader ? `${contentHeader}\n${text}` : wrapContent(text);
}

export function wrapContext(json: string): string {
  return `\n${CONTEXT_MARKER}\n${json}`;
}

/**
 * Separate openui-lang code from inline context in a message.
 * Returns { content: the message/code, contextString: raw JSON or null }
 */
export function separateContentAndContext(raw: string): {
  content: string;
  contextString: string | null;
  contentHeader?: string;
} {
  const lastContentIdx = raw.lastIndexOf(CONTENT_MARKER);
  const lastContextIdx = raw.lastIndexOf(CONTEXT_MARKER);

  // Plain text: no inline transport markers
  if (lastContentIdx === -1 && lastContextIdx === -1) {
    return { content: raw, contextString: null };
  }

  // Only context section
  if (lastContentIdx === -1) {
    return {
      content: stripSectionSeparator(raw.slice(0, lastContextIdx)),
      contextString: raw.slice(bodyStartIndex(raw, lastContextIdx)),
    };
  }

  // Content-only response
  if (lastContextIdx === -1 || lastContentIdx > lastContextIdx) {
    return {
      content: raw.slice(bodyStartIndex(raw, lastContentIdx)),
      contextString: null,
      // Preserve attrs when this message is rewritten.
      contentHeader: contentHeader(raw, lastContentIdx),
    };
  }

  // Content section followed by context section
  return {
    content: stripSectionSeparator(raw.slice(bodyStartIndex(raw, lastContentIdx), lastContextIdx)),
    contextString: raw.slice(bodyStartIndex(raw, lastContextIdx)),
    // Preserve attrs when this message is rewritten.
    contentHeader: contentHeader(raw, lastContentIdx),
  };
}

// Extract the full content header line
function contentHeader(raw: string, markerIdx: number): string {
  const headerEndIdx = raw.indexOf("\n", markerIdx);
  return headerEndIdx === -1 ? raw.slice(markerIdx) : raw.slice(markerIdx, headerEndIdx);
}

function bodyStartIndex(raw: string, markerIdx: number): number {
  const headerEndIdx = raw.indexOf("\n", markerIdx);
  return headerEndIdx === -1 ? raw.length : headerEndIdx + 1;
}

// Remove only the newline that separates two sections; body whitespace could be meaningful for inline mode
function stripSectionSeparator(value: string): string {
  if (value.endsWith("\r\n")) {
    return value.slice(0, -2);
  }

  if (value.endsWith("\n")) {
    return value.slice(0, -1);
  }

  return value;
}
