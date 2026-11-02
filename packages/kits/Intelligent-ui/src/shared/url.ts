function protocolOf(value: string): string | null {
  try {
    return new URL(value.trim()).protocol;
  } catch {
    return null;
  }
}

/** An absolute http(s) URL, or null. Relative URLs would resolve against this app. */
export function webUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const protocol = protocolOf(value);
  return protocol === "http:" || protocol === "https:" ? value.trim() : null;
}
